"use client";

import { useEffect, useState, useRef } from 'react';
import { FaMicrophone, FaMicrophoneSlash } from 'react-icons/fa';

export default function Home() {
  const [originalText, setOriginalText] = useState<string[]>([]);
  const [translatedText, setTranslatedText] = useState<string[]>([]);
  const [sourceLanguage, setSourceLanguage] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const sessionRef = useRef<any>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const originalTextRef = useRef<HTMLDivElement>(null);
  const translatedTextRef = useRef<HTMLDivElement>(null);
  let vadTime = 0;

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'fi', name: 'Finnish' },
    { code: 'ru', name: 'Russian' },
  ];

  // Auto-scroll effect for original text
  useEffect(() => {
    if (originalTextRef.current) {
      originalTextRef.current.scrollTop = originalTextRef.current.scrollHeight;
    }
  }, [originalText]);

  // Auto-scroll effect for translated text
  useEffect(() => {
    if (translatedTextRef.current) {
      translatedTextRef.current.scrollTop = translatedTextRef.current.scrollHeight;
    }
  }, [translatedText]);

  const handleTranscript = async (transcriptData: any) => {
      // Add original transcript
      setOriginalText(prev => [...prev, "\n", transcriptData.transcript]);

      const formData = new FormData();
      formData.append('text', transcriptData.transcript);
      formData.append('sourceLanguage', sourceLanguage);
      formData.append('targetLanguage', targetLanguage);
      formData.append('sessionId', sessionRef.current.sessionId);

      const response = await fetch('/api/translate', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to translate audio');
      }

     const data = await response.json();
     // Add translation
     setTranslatedText(prev => [...prev, "\n", data.text]);
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const sessionResponse = await fetch('/api/session', {
        method: 'POST'
      });
      if (!sessionResponse.ok) {
        throw new Error('Failed to get session token');
      }
      const sessionData = await sessionResponse.json();
      const clientSecret = sessionData.client_secret.value;

            console.log(sessionData);
      
            // here we start working with realtime api

      const pc = new RTCPeerConnection();
      pc.addTrack(stream.getTracks()[0]);
      const dc = pc.createDataChannel('');
      // dc.onopen = (e: any) => console.log(e);
      dc.onmessage = (e: any) => {
        let parsed = JSON.parse(e.data);
        // console.log(parsed);
        let transcript = null;
        switch (parsed.type) {
          // case "transcription_session.created":
          //   let sessionConfig = parsed.session;
          //   console.log("session created: " + sessionConfig.id);
          //   break;
          case "input_audio_buffer.speech_started":
            // transcript = {
            //   transcript: "...",
            //   partial: true,
            // }
            // handleTranscript(transcript);
            break;
          case "input_audio_buffer.speech_stopped":
            // transcript = {
            //   transcript: "***",
            //   partial: true,
            // }
            // handleTranscript(transcript);
            // vadTime = performance.now() - sessionConfig.turn_detection.silence_duration_ms;
            break;
          //case "conversation.item.input_audio_transcription.delta":
          //  transcriptEl.value += parsed.delta;
          //  break;
          case "conversation.item.input_audio_transcription.completed":
            const elapsed = performance.now() - vadTime;
            transcript = {
              transcript: parsed.transcript,
              partial: false,
              latencyMs: elapsed.toFixed(0)
            }

            handleTranscript(transcript);
            break;
        }
      }

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      let sdpResponse = await fetch(`https://api.openai.com/v1/realtime`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${clientSecret}`,        
          "Content-Type": "application/sdp"
        },
      });
      if (!sdpResponse.ok) {
        throw new Error("Failed to signal");
      }

      await pc.setRemoteDescription({ type: "answer", sdp: await sdpResponse.text() })
      const sessionId =       sessionData.id;

      sessionRef.current = { pc, dc, sessionId }; 
      
      setIsRecording(true);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const stopRecording = () => {
    if (sessionRef.current) {
      sessionRef.current.pc.close();
      sessionRef.current = null;
    }
    setIsRecording(false);
    setIsRecording(false);
  };

  const startNewSession = () => {
    setOriginalText([]);
    setTranslatedText([]);
  };

  const sendAudioToServer = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('sourceLanguage', sourceLanguage);
      formData.append('targetLanguage', targetLanguage);

      const response = await fetch('/api/translate', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to translate audio');
      }

      const data = await response.json();
      setTranslatedText(prev => [...prev, data.text]);
    } catch (error) {
      console.error('Error sending audio to server:', error);
    }
  };

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">Voice Translator</h1>
        
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="sourceLanguage" className="block text-sm font-medium text-gray-700 mb-2">
                Source Language
              </label>
              <select
                id="sourceLanguage"
                value={sourceLanguage}
                onChange={(e) => setSourceLanguage(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium"
              >
                <option value="" className="text-gray-500">Select language</option>
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code} className="text-gray-900">
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="targetLanguage" className="block text-sm font-medium text-gray-700 mb-2">
                Target Language
              </label>
              <select
                id="targetLanguage"
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium"
              >
                <option value="" className="text-gray-500">Select language</option>
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code} className="text-gray-900">
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={!sourceLanguage || !targetLanguage}
              className={`p-4 rounded-full transition-all duration-200 ${
                sourceLanguage && targetLanguage
                  ? isRecording 
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {sourceLanguage && targetLanguage ? (
                isRecording ? (
                  <FaMicrophoneSlash className="w-8 h-8" />
                ) : (
                  <FaMicrophone className="w-8 h-8" />
                )
              ) : (
                <FaMicrophoneSlash className="w-8 h-8" />
              )}
            </button>

            {originalText.length > 0 && !isRecording && (
              <button
                onClick={startNewSession}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md transition-colors"
              >
                New Session
              </button>
            )}
          </div>

          {(isRecording || originalText.length > 0) && (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">
                    Original ({languages.find(l => l.code === sourceLanguage)?.name})
                  </h2>
                </div>
                <div
                  ref={originalTextRef}
                  className="min-h-[200px] max-h-[500px] p-4 bg-gray-50 rounded-md overflow-y-auto"
                >
                  <p className="text-gray-800 whitespace-pre-wrap">
                    {originalText.join(' ')}
                  </p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-lg">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">
                    Translation ({languages.find(l => l.code === targetLanguage)?.name})
                  </h2>
                </div>
                <div
                  ref={translatedTextRef}
                  className="min-h-[200px] max-h-[500px] p-4 bg-gray-50 rounded-md overflow-y-auto"
                >
                  <p className="text-gray-800 whitespace-pre-wrap">
                    {translatedText.join(' ')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
