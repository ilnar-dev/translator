import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { createReadStream } from 'fs';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    const sourceLanguage = formData.get('sourceLanguage') as string;
    const targetLanguage = formData.get('targetLanguage') as string;

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Create a temporary file
    const tempFilePath = join(tmpdir(), `audio-${Date.now()}.webm`);
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(tempFilePath, buffer);
    
    // First, transcribe the audio
    const transcription = await openai.audio.transcriptions.create({
      file: createReadStream(tempFilePath),
      model: "whisper-1",
      response_format: "verbose_json",
      language: sourceLanguage || undefined,
    });

    if (transcription.text === null) {
      return NextResponse.json({ error: 'No text detected' }, { status: 400 });
    }

    // Then, translate the transcribed text
    const translation = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a translator. Translate the following text from ${sourceLanguage} to ${targetLanguage}. Only return the translated text, nothing else.`
        },
        {
          role: "user",
          content: transcription.text
        }
      ],
    });
    
    return NextResponse.json({ text: translation.choices[0].message.content });

  } catch (error) {
    console.error('Error processing audio translation:', error);
    return NextResponse.json({ error: 'Failed to process audio translation' }, { status: 500 });
  }
} 