"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Terms the recogniser would otherwise mangle. Nova-3 accepts a repeated
 * `keyterm` parameter in English and weights these towards being heard.
 */
const KEYTERMS = [
  "lemma",
  "modulo",
  "congruent",
  "integer",
  "rational",
  "polynomial",
  "coefficient",
  "isosceles",
  "quadrilateral",
  "bisector",
  "cyclic",
  "induction",
  "contradiction",
  "pigeonhole",
  "binomial",
  "factorial",
  "summation",
];

const LISTEN_URL = `wss://api.deepgram.com/v1/listen?${new URLSearchParams([
  ["model", "nova-3"],
  ["language", "en"],
  ["smart_format", "true"],
  ["interim_results", "true"],
  ...KEYTERMS.map((term): [string, string] => ["keyterm", term]),
]).toString()}`;

export type DictationStatus = "idle" | "starting" | "listening";

type DeepgramMessage = {
  type?: string;
  is_final?: boolean;
  channel?: { alternatives?: Array<{ transcript?: string }> };
};

/**
 * Streams microphone audio to Deepgram and hands back finalised transcript
 * chunks. The API key stays server-side: the browser only ever sees a
 * short-lived token, which it needs solely for the opening handshake.
 */
export function useDictation(onTranscript: (text: string) => void) {
  const [status, setStatus] = useState<DictationStatus>("idle");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState("");
  const socketRef = useRef<WebSocket | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const transcriptRef = useRef(onTranscript);

  useEffect(() => {
    transcriptRef.current = onTranscript;
  }, [onTranscript]);

  const teardown = useCallback(() => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: "CloseStream" }));
      socketRef.current.close();
    }
    recorderRef.current = null;
    streamRef.current = null;
    socketRef.current = null;
    setInterim("");
    setStatus("idle");
  }, []);

  useEffect(() => teardown, [teardown]);

  const start = useCallback(async () => {
    setError("");
    setStatus("starting");

    try {
      const tokenResponse = await fetch("/api/deepgram-token", { method: "POST" });
      const tokenPayload = (await tokenResponse.json()) as {
        accessToken?: string;
        error?: string;
      };
      if (!tokenResponse.ok || !tokenPayload.accessToken) {
        throw new Error(tokenPayload.error ?? "Dictation is unavailable.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const socket = new WebSocket(LISTEN_URL, ["bearer", tokenPayload.accessToken]);
      socketRef.current = socket;

      socket.onopen = () => {
        const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
        recorderRef.current = recorder;
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0 && socket.readyState === WebSocket.OPEN) {
            socket.send(event.data);
          }
        };
        recorder.start(250);
        setStatus("listening");
      };

      socket.onmessage = (event) => {
        const message = JSON.parse(event.data as string) as DeepgramMessage;
        if (message.type !== "Results") return;
        const text = message.channel?.alternatives?.[0]?.transcript?.trim();
        if (!text) return;
        if (message.is_final) {
          setInterim("");
          transcriptRef.current(text);
        } else {
          setInterim(text);
        }
      };

      socket.onerror = () => {
        setError("Lost the connection to the transcriber.");
        teardown();
      };
    } catch (dictationError) {
      setError(
        dictationError instanceof DOMException
          ? "MathMatch needs microphone access to take dictation."
          : dictationError instanceof Error
            ? dictationError.message
            : "Dictation is unavailable.",
      );
      teardown();
    }
  }, [teardown]);

  return { status, interim, error, start, stop: teardown };
}
