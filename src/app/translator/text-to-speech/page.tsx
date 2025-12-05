"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { FaMicrophone, FaMicrophoneSlash } from "react-icons/fa";
import { Clock, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Container } from "@/components/ui/container";

interface SessionSummary {
  sessionId: string;
  sourceLanguage: string;
  targetLanguage: string;
  translationCount: number;
  createdAt: string;
  lastUpdated: string;
  preview: string;
}

interface TranslationEntry {
  timestamp: string;
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
}

interface SessionDetail {
  sessionId: string;
  translations: TranslationEntry[];
  createdAt: string;
  lastUpdated: string;
}

export default function TranslatorPage() {
  const [originalText, setOriginalText] = useState<string[]>([]);
  const [translatedText, setTranslatedText] = useState<string[]>([]);
  const [sourceLanguage, setSourceLanguage] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [currentDbSessionId, setCurrentDbSessionId] = useState<string | null>(null);

  type RealtimeSession = {
    pc: RTCPeerConnection;
    dc: RTCDataChannel;
    sessionId: string;
  };
  const sessionRef = useRef<RealtimeSession | null>(null);
  const originalTextRef = useRef<HTMLDivElement>(null);
  const translatedTextRef = useRef<HTMLDivElement>(null);

  type TranscriptPayload = {
    transcript: string;
    partial: boolean;
    latencyMs?: string;
  };

  const languages = [
    { code: "en", name: "English" },
    { code: "fi", name: "Finnish" },
    { code: "ru", name: "Russian" },
  ];

  const fetchSessions = useCallback(async () => {
    try {
      setSessionsLoading(true);
      const response = await fetch("/api/sessions");
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    if (originalTextRef.current) {
      originalTextRef.current.scrollTop = originalTextRef.current.scrollHeight;
    }
  }, [originalText]);

  useEffect(() => {
    if (translatedTextRef.current) {
      translatedTextRef.current.scrollTop = translatedTextRef.current.scrollHeight;
    }
  }, [translatedText]);

  const restoreSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/session/${sessionId}`);
      if (!response.ok) {
        console.error("Failed to load session");
        return;
      }
      const data: SessionDetail = await response.json();

      const originals: string[] = [];
      const translations: string[] = [];
      data.translations.forEach((entry) => {
        originals.push("\n", entry.originalText);
        translations.push("\n", entry.translatedText);
      });

      setOriginalText(originals);
      setTranslatedText(translations);
      setCurrentDbSessionId(data.sessionId);

      if (data.translations.length > 0) {
        const firstEntry = data.translations[0];
        setSourceLanguage(firstEntry.sourceLanguage);
        setTargetLanguage(firstEntry.targetLanguage);
      }
    } catch (error) {
      console.error("Error restoring session:", error);
    }
  };

  const handleTranscript = async (transcriptData: TranscriptPayload) => {
    if (!sessionRef.current) {
      console.warn("No active session for transcript");
      return;
    }

    setOriginalText((prev) => [...prev, "\n", transcriptData.transcript]);

    const formData = new FormData();
    formData.append("text", transcriptData.transcript);
    formData.append("sourceLanguage", sourceLanguage);
    formData.append("targetLanguage", targetLanguage);
    formData.append("sessionId", sessionRef.current.sessionId);

    const response = await fetch("/api/translate", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to translate audio");
    }

    const data = await response.json();
    setTranslatedText((prev) => [...prev, "\n", data.text]);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const sessionResponse = await fetch("/api/session", {
        method: "POST",
      });
      if (!sessionResponse.ok) {
        throw new Error("Failed to get session token");
      }
      const sessionData = await sessionResponse.json();
      const clientSecret = sessionData.client_secret.value;

      const pc = new RTCPeerConnection();
      pc.addTrack(stream.getTracks()[0], stream);

      const configureDataChannel = (channel: RTCDataChannel) => {
        channel.onopen = () => {
          console.info("Realtime data channel open:", channel.label || "(default)");
        };
        channel.onerror = (event) => {
          console.error("Realtime data channel error", event);
        };
        channel.onmessage = (event: MessageEvent<string>) => {
          const parsed = JSON.parse(event.data);
          console.debug("Realtime event", parsed);
          let transcript = null;
          switch (parsed.type) {
            case "input_audio_buffer.speech_started":
              break;
            case "input_audio_buffer.speech_stopped":
              break;
            case "conversation.item.input_audio_transcription.completed":
              const elapsed = performance.now();
              transcript = {
                transcript: parsed.transcript,
                partial: false,
                latencyMs: elapsed.toFixed(0),
              };

              handleTranscript(transcript);
              break;
          }
        };
      };

      const dc = pc.createDataChannel("oai-events");
      configureDataChannel(dc);

      pc.ondatachannel = (event) => {
        console.info("Realtime remote data channel", event.channel.label);
        configureDataChannel(event.channel);
      };

      pc.onconnectionstatechange = () => {
        console.info("PeerConnection state:", pc.connectionState);
      };

      const waitForIceGatheringComplete = async () => {
        if (pc.iceGatheringState === "complete") {
          return;
        }
        await new Promise<void>((resolve) => {
          const checkState = () => {
            if (pc.iceGatheringState === "complete") {
              pc.removeEventListener("icegatheringstatechange", checkState);
              resolve();
            }
          };
          pc.addEventListener("icegatheringstatechange", checkState);
        });
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await waitForIceGatheringComplete();
      const sdpResponse = await fetch(`https://api.openai.com/v1/realtime`, {
        method: "POST",
        body: pc.localDescription?.sdp ?? offer.sdp,
        headers: {
          Authorization: `Bearer ${clientSecret}`,
          "Content-Type": "application/sdp",
        },
      });
      if (!sdpResponse.ok) {
        throw new Error("Failed to signal");
      }

      await pc.setRemoteDescription({ type: "answer", sdp: await sdpResponse.text() });

      const sessionId = currentDbSessionId || sessionData.id;
      setCurrentDbSessionId(sessionId);

      sessionRef.current = { pc, dc, sessionId };
      setIsRecording(true);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const stopRecording = () => {
    if (sessionRef.current) {
      sessionRef.current.pc.close();
      sessionRef.current = null;
    }
    setIsRecording(false);
    fetchSessions();
  };

  const startNewSession = () => {
    setOriginalText([]);
    setTranslatedText([]);
    setCurrentDbSessionId(null);
  };

  const recordingDisabled = !sourceLanguage || !targetLanguage;
  const sourceLabel = languages.find((l) => l.code === sourceLanguage)?.name ?? "Select";
  const targetLabel = languages.find((l) => l.code === targetLanguage)?.name ?? "Select";

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <main className="min-h-screen bg-slate-950 py-12 text-white">
      <Container className="space-y-8">
        {/* Header */}
        <div className="space-y-4 text-center">
          <Badge className="border border-emerald-400 bg-emerald-500/10 text-emerald-300">
            Live translator beta
          </Badge>
          <div>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Realtime Text-to-Speech Translator
            </h1>
            <p className="mt-3 text-base text-slate-300 sm:text-lg">
              Capture audio, see instant transcripts, and stream translated voiceovers in one fluid
              workflow.
            </p>
          </div>
        </div>

        {/* Controls on top */}
        <Card className="overflow-hidden border-white/10 bg-white/5 text-slate-100">
          <CardContent className="p-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              {/* Language selectors */}
              <div className="grid flex-1 gap-4 sm:grid-cols-2 lg:max-w-xl">
                <div className="space-y-2">
                  <label
                    htmlFor="sourceLanguage"
                    className="text-sm font-medium text-slate-200"
                  >
                    Source language
                  </label>
                  <select
                    id="sourceLanguage"
                    value={sourceLanguage}
                    onChange={(e) => setSourceLanguage(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                  >
                    <option value="">Select language</option>
                    {languages.map((lang) => (
                      <option key={lang.code} value={lang.code} className="text-slate-900">
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="targetLanguage"
                    className="text-sm font-medium text-slate-200"
                  >
                    Target language
                  </label>
                  <select
                    id="targetLanguage"
                    value={targetLanguage}
                    onChange={(e) => setTargetLanguage(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                  >
                    <option value="">Select language</option>
                    {languages.map((lang) => (
                      <option key={lang.code} value={lang.code} className="text-slate-900">
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status indicator */}
              <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      isRecording ? "animate-pulse bg-red-400" : currentDbSessionId ? "bg-amber-400" : "bg-slate-500"
                    }`}
                  />
                  <span className="text-sm font-medium">
                    {isRecording ? "Recording" : currentDbSessionId ? "Restored" : "Idle"}
                  </span>
                </div>
                <div className="h-4 w-px bg-white/20" />
                <span className="text-sm text-slate-400">
                  {originalText.filter(t => t !== "\n").length} lines
                </span>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={recordingDisabled}
                  size="lg"
                  className={`${
                    isRecording
                      ? "bg-red-500 hover:bg-red-500/90"
                      : "bg-blue-500 hover:bg-blue-500/90"
                  }`}
                >
                  {isRecording ? (
                    <>
                      <FaMicrophoneSlash className="mr-2 h-5 w-5" />
                      Stop capture
                    </>
                  ) : (
                    <>
                      <FaMicrophone className="mr-2 h-5 w-5" />
                      {currentDbSessionId ? "Continue" : "Start capture"}
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  disabled={isRecording || originalText.length === 0}
                  onClick={startNewSession}
                  className="border-white/40 bg-transparent text-white hover:bg-white/10"
                >
                  Reset
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main content grid */}
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          {/* Session History Sidebar */}
          <Card className="overflow-hidden border-white/10 bg-white/5 text-slate-100 lg:self-start">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Session history
              </CardTitle>
              <CardDescription className="text-slate-400">
                Restore a previous session to continue where you left off.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sessionsLoading ? (
                <p className="text-sm text-slate-500">Loading sessions...</p>
              ) : sessions.length === 0 ? (
                <p className="text-sm text-slate-500">No sessions yet. Start recording to create one.</p>
              ) : (
                <div className="max-h-[400px] space-y-2 overflow-y-auto lg:max-h-[600px]">
                  {sessions.map((session) => (
                    <button
                      key={session.sessionId}
                      onClick={() => restoreSession(session.sessionId)}
                      disabled={isRecording}
                      className={`w-full rounded-xl border p-3 text-left transition-colors ${
                        currentDbSessionId === session.sessionId
                          ? "border-blue-500 bg-blue-500/10"
                          : "border-white/10 bg-white/5 hover:bg-white/10"
                      } ${isRecording ? "cursor-not-allowed opacity-50" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="secondary"
                              className="shrink-0 bg-slate-700 text-xs text-slate-300"
                            >
                              {session.sourceLanguage} → {session.targetLanguage}
                            </Badge>
                            <span className="text-xs text-slate-500">
                              {session.translationCount} entries
                            </span>
                          </div>
                          <p className="mt-1 truncate text-sm text-slate-300">
                            {session.preview}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <span className="text-xs text-slate-500">
                            {formatTimeAgo(session.lastUpdated)}
                          </span>
                          <RotateCcw className="h-4 w-4 text-slate-500" />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Transcript panels */}
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle className="text-white">
                    Original{" "}
                    <span className="text-sm font-normal text-slate-400">
                      ({sourceLabel})
                    </span>
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Live transcript of what your microphone hears.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    ref={originalTextRef}
                    className="h-[280px] w-full overflow-y-auto rounded-2xl border border-white/10 bg-slate-900/30 p-4 text-sm text-slate-100"
                    aria-live="polite"
                  >
                    {originalText.length ? (
                      <p className="whitespace-pre-wrap leading-relaxed">{originalText.join(" ")}</p>
                    ) : (
                      <p className="text-slate-500">Waiting for speech...</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle className="text-white">
                    Translation{" "}
                    <span className="text-sm font-normal text-slate-400">
                      ({targetLabel})
                    </span>
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Generated output from the AI translation pipeline.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    ref={translatedTextRef}
                    className="h-[280px] w-full overflow-y-auto rounded-2xl border border-white/10 bg-slate-900/30 p-4 text-sm text-slate-100"
                    aria-live="polite"
                  >
                    {translatedText.length ? (
                      <p className="whitespace-pre-wrap leading-relaxed">
                        {translatedText.join(" ")}
                      </p>
                    ) : (
                      <p className="text-slate-500">Translation will appear here.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle className="text-white">Quick guide</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-400">
                <p>
                  1. Select your source and target languages above. <br />
                  2. Hit &quot;Start capture&quot; and speak clearly into your microphone. <br />
                  3. Stop the session to free the channel, then reset for a new conversation. <br />
                  4. Use session history on the left to restore and continue previous sessions.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </Container>
    </main>
  );
}
