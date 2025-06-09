"use client";

import { useEffect, useState, useRef } from 'react';
import { FaMicrophone, FaMicrophoneSlash } from 'react-icons/fa';

export default function Home() {
  const [streamedText, setStreamedText] = useState<string[]>([]);
  const [sourceLanguage, setSourceLanguage] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'fi', name: 'Finnish' },
    { code: 'ru', name: 'Russian' },
  ];

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const startNewRecording = () => {
        if (!streamRef.current) return;
        
        const mediaRecorder = new MediaRecorder(streamRef.current, {
          mimeType: 'audio/webm',
        });
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = async (event) => {
          if (event.data.size > 0) {
            await sendAudioToServer(event.data);
          }
        };

        mediaRecorder.start();
        
        // Stop and send after 10 seconds
        setTimeout(() => {
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
          }
        }, 10000);
      };

      // Start first recording
      startNewRecording();
      
      // Set up interval to create new recordings every 10 seconds
      recordingIntervalRef.current = setInterval(startNewRecording, 10000);
      
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Error accessing microphone. Please ensure you have granted microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsRecording(false);
  };

  const startNewSession = () => {
    setStreamedText([]);
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
      setStreamedText(prev => [...prev, data.text]);
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

            {streamedText.length > 0 && !isRecording && (
              <button
                onClick={startNewSession}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md transition-colors"
              >
                New Session
              </button>
            )}
          </div>

          {(isRecording || streamedText.length > 0) && (
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  {isRecording ? 'Recording...' : 'Transcription'}
                </h2>
              </div>
              <div className="min-h-[200px] p-4 bg-gray-50 rounded-md">
                <p className="text-gray-800 whitespace-pre-wrap">
                  {streamedText.join(' ')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
