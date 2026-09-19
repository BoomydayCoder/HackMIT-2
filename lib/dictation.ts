"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type DictationStatus = "idle" | "listening" | "transcribing";

/**
 * Records the microphone and hands the clip to the server for transcription,
 * appending the text it gets back. Recording stays entirely in the browser;
 * the Deepgram key never leaves the server.
 */
export function useDictation(onTranscript: (text: string) => void) {
  const [status, setStatus] = useState<DictationStatus>("idle");
  const [error, setError] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const transcriptRef = useRef(onTranscript);

  useEffect(() => {
    transcriptRef.current = onTranscript;
  }, [onTranscript]);

  const releaseMic = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    recorderRef.current = null;
  }, []);

  useEffect(() => releaseMic, [releaseMic]);

  const transcribe = useCallback(async (clip: Blob) => {
    setStatus("transcribing");
    try {
      const response = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": clip.type || "audio/webm" },
        body: clip,
      });
      const payload = (await response.json()) as {
        transcript?: string;
        error?: string;
      };
      if (!response.ok) throw new Error(payload.error ?? "Transcription failed.");
      if (payload.transcript) transcriptRef.current(payload.transcript);
      else setError("Nothing was picked up — try speaking closer to the mic.");
    } catch (transcriptionError) {
      setError(
        transcriptionError instanceof Error
          ? transcriptionError.message
          : "Transcription failed.",
      );
    } finally {
      setStatus("idle");
    }
  }, []);

  const start = useCallback(async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      recorderRef.current = recorder;

      const chunks: Blob[] = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };
      recorder.onstop = () => {
        releaseMic();
        if (chunks.length) void transcribe(new Blob(chunks, { type: recorder.mimeType }));
        else setStatus("idle");
      };

      recorder.start();
      setStatus("listening");
    } catch {
      setError("MathMatch needs microphone access to take dictation.");
      releaseMic();
      setStatus("idle");
    }
  }, [releaseMic, transcribe]);

  const stop = useCallback(() => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    else {
      releaseMic();
      setStatus("idle");
    }
  }, [releaseMic]);

  return { status, error, start, stop };
}
