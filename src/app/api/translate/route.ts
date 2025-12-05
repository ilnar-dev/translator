import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { addTranslationToSession, getConversationHistory } from '@/lib/db/sessions';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const text = formData.get('text') as string;
    const sourceLanguage = formData.get('sourceLanguage') as string;
    const targetLanguage = formData.get('targetLanguage') as string;
    const sessionId = formData.get('sessionId') as string;

    if (!text) {
      return NextResponse.json({ error: 'No text for translation provided' }, { status: 400 });
    }

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Get full conversation history to maintain context
    const conversationHistory = await getConversationHistory(sessionId);

    const systemPrompt = `You are a professional translator. Translate the following text from ${sourceLanguage} to ${targetLanguage}.
Maintain context and consistency with the ongoing conversation. Only return the translated text, nothing else.
Important: Keep the same tone, formality level, and terminology consistent throughout the conversation.`;

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: systemPrompt
      },
      ...conversationHistory,
      {
        role: "user",
        content: text
      }
    ];

    const translation = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Faster and better than gpt-3.5-turbo
      messages: messages,
      temperature: 0.3, // Lower temperature for more consistent translations
    });

    const translatedText = translation.choices[0].message.content;

    // Store the translation in session history
    if (translatedText) {
      await addTranslationToSession(sessionId, text, translatedText, sourceLanguage, targetLanguage);
    }

    return NextResponse.json({ text: translatedText });

  } catch (error) {
    console.error('Error processing translation:', error);
    return NextResponse.json({ error: 'Failed to process translation' }, { status: 500 });
  }
} 