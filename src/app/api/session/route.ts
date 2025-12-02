import { NextResponse } from 'next/server';

export async function POST() {
    const r = await fetch("https://api.openai.com/v1/realtime/transcription_sessions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "openai-beta": "realtime-v1",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input_audio_transcription: {
        model: "gpt-4o-transcribe",
        // prompt: "You are a translator. Translate the following text from Finnish to Russian. Only return the translated text, nothing else."
      },
      turn_detection: {
        type: "server_vad"
      }
    }),
  });
  const data = await r.json();

  // Send back the JSON we received from the OpenAI REST API
  return NextResponse.json(data);
}