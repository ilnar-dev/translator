import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import multer from 'multer';
import { createReadStream } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { writeFile } from 'fs/promises';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Make sure to set this in your .env file
});

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json());

// Basic route
//app.get('/', async (req: Request, res: Response) => {
//  try {
//    const completion = await openai.chat.completions.create({
//      messages: [{ role: "user", content: "Hello, how are you?" }],
//      model: "gpt-3.5-turbo",
//    });
//
//    res.json(completion.choices[0].message.content);
//  } catch (error) {
//    console.error('Error:', error);
//    res.status(500).json({ error: 'Failed to get response from OpenAI' });
//  }
//});
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

app.get('/', async (req: Request, res: Response) => {
  await sleep(10000);
  res.json({ message: 'Hello, world!' });
});

app.get('/api/stream', async (req, res) => {
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const text = "This is a streaming text response. It will be sent in chunks to demonstrate how streaming works. Each chunk will appear as it arrives.";
  const chunks = text.split(' ');

  // Send each chunk with a delay
  for (const chunk of chunks) {
    res.write(`data: ${chunk}\n\n`);
    await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay between chunks
  }

  res.end();
});

// Audio streaming endpoint
app.post('/api/transcribe', upload.single('audio'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No audio file provided' });
      return;
    }

    console.log('audio file received');

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Create a temporary file
    const tempFilePath = join(tmpdir(), `audio-${Date.now()}.webm`);
    await writeFile(tempFilePath, req.file.buffer);
    
    // Create transcription
    const transcription = await openai.audio.transcriptions.create({
      file: createReadStream(tempFilePath),
      model: "whisper-1",
      response_format: "verbose_json",
      language: req.body.sourceLanguage || undefined,
    });
    
    // Send the transcription result
    res.write(`data: ${JSON.stringify({ text: transcription.text })}\n\n`);
    res.end();

  } catch (error) {
    console.error('Error processing audio:', error);
    res.status(500).json({ error: 'Failed to process audio' });
  }
});

// Translation endpoint
app.post('/api/translate', upload.single('audio'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No audio file provided' });
      return;
    }

    console.log('audio file received for translation');

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Create a temporary file
    const tempFilePath = join(tmpdir(), `audio-${Date.now()}.webm`);
    await writeFile(tempFilePath, req.file.buffer);
    
    // First, transcribe the audio
    const transcription = await openai.audio.transcriptions.create({
      file: createReadStream(tempFilePath),
      model: "whisper-1",
      response_format: "verbose_json",
      language: req.body.sourceLanguage || undefined,
    });

    // Then, translate the transcribed text
    const translation = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a translator. Translate the following text from ${req.body.sourceLanguage} to ${req.body.targetLanguage}. Only return the translated text, nothing else.`
        },
        {
          role: "user",
          content: transcription.text
        }
      ],
    });
    
    // Send the translation result
    res.write(`data: ${JSON.stringify({ text: translation.choices[0].message.content })}\n\n`);
    res.end();

  } catch (error) {
    console.error('Error processing audio translation:', error);
    res.status(500).json({ error: 'Failed to process audio translation' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});