"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MicIcon } from "./Icons";

const DURATIONS = [30, 60, 120, 180] as const;

export default function Recorder() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const promptId = searchParams.get("prompt");

  const [maxSeconds, setMaxSeconds] = useState<number>(60);
  const [phase, setPhase] = useState<"idle" | "recording" | "preview" | "publishing" | "error">("idle");
  const [elapsed, setElapsed] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [level, setLevel] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const tickRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      stopStream();
      if (tickRef.current) clearInterval(tickRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  function stopStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
  }

  async function startRecording() {
    setError(null);
    setBlob(null);
    setElapsed(0);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      visualize();

      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "";
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const b = new Blob(chunksRef.current, { type: mime || "audio/webm" });
        setBlob(b);
        setPhase("preview");
      };
      recorder.start();
      setPhase("recording");
      tickRef.current = window.setInterval(() => {
        setElapsed((n) => {
          const next = n + 1;
          if (next >= maxSeconds) {
            stopRecording();
          }
          return next;
        });
      }, 1000);
    } catch (err) {
      console.error(err);
      setError((err as Error).message || "Could not access microphone");
      setPhase("error");
    }
  }

  function visualize() {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const data = new Uint8Array(analyser.frequencyBinCount);
    const loop = () => {
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const v = (data[i] - 128) / 128;
        sum += v * v;
      }
      setLevel(Math.sqrt(sum / data.length));
      rafRef.current = requestAnimationFrame(loop);
    };
    loop();
  }

  function stopRecording() {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    const r = mediaRecorderRef.current;
    if (r && r.state !== "inactive") r.stop();
    stopStream();
  }

  function reset() {
    setBlob(null);
    setElapsed(0);
    setPhase("idle");
    setError(null);
  }

  async function publish() {
    if (!blob) return;
    setPhase("publishing");
    try {
      const form = new FormData();
      form.append("audio", blob, "story.webm");
      form.append("duration_seconds", String(elapsed || maxSeconds));
      if (promptId) form.append("prompt_id", promptId);
      const res = await fetch("/api/stories", { method: "POST", body: form });
      if (!res.ok) throw new Error(await res.text());
      router.push("/feed");
    } catch (err) {
      console.error(err);
      setError((err as Error).message);
      setPhase("error");
    }
  }

  const barCount = 36;
  const bars = Array.from({ length: barCount }).map((_, i) => {
    const base = Math.min(1, level * 4.5);
    const jitter = (Math.sin((i + elapsed * 4) * 0.6) + 1) / 2;
    return phase === "recording" ? Math.max(0.12, base * (0.4 + jitter * 0.6)) : 0.1;
  });

  const fmtTime = fmt(elapsed);
  const fmtMax = fmt(maxSeconds);

  return (
    <div className="py-3 space-y-5">
      <header className="space-y-2">
        <div className="font-sans text-[10px] font-bold tracking-[0.16em] uppercase text-sienna">
          {promptId ? "Responding to a whisper" : "New story"}
        </div>
        <h1 className="font-sans text-3xl font-semibold text-espresso">
          {promptId ? "Answer the whisper" : "Share a voice story"}
        </h1>
        <p className="font-sans text-sm text-espresso-soft max-w-md">
          Up to {maxSeconds}s. AI will wrap it in matching music and ambient
          sound after you publish.
        </p>
      </header>

      {/* Duration selector */}
      {phase === "idle" && (
        <div className="flex gap-2 flex-wrap">
          {DURATIONS.map((d) => (
            <button
              key={d}
              onClick={() => setMaxSeconds(d)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                maxSeconds === d
                  ? "bg-plum text-cream shadow-cozy-sm"
                  : "bg-cream text-espresso-soft hover:bg-plum-tint hover:text-plum"
              }`}
            >
              {d === 30 ? "30s" : d === 60 ? "1 min" : d === 120 ? "2 min" : "3 min"}
            </button>
          ))}
        </div>
      )}

      {/* Deck */}
      <div className="cozy-card p-5 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`inline-block w-2 h-2 rounded-full ${phase === "recording" ? "bg-sienna soft-pulse" : "bg-espresso/20"}`} />
            <span className="font-sans text-xs font-medium text-espresso-soft">
              {phase === "recording"
                ? "Recording"
                : phase === "preview"
                ? "Preview"
                : phase === "publishing"
                ? "Publishing…"
                : phase === "error"
                ? "Error"
                : "Ready"}
            </span>
          </div>
          <span className="font-sans text-sm font-semibold text-espresso tabular-nums">
            {fmtTime} <span className="text-espresso-faint font-normal">/ {fmtMax}</span>
          </span>
        </div>

        <div className="bg-plum-mist rounded-[18px] p-4">
          <div className="flex items-center gap-[3px]" style={{ height: 56 }}>
            {bars.map((h, i) => (
              <span
                key={i}
                className="flex-1 rounded-full transition-all"
                style={{
                  height: `${Math.max(6, h * 100)}%`,
                  minWidth: "3px",
                  background: phase === "recording" ? "var(--sienna)" : "rgba(61, 47, 40, 0.18)",
                }}
              />
            ))}
          </div>
        </div>

        {phase === "idle" || phase === "error" ? (
          <button
            onClick={startRecording}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-full bg-plum text-cream font-sans text-sm font-semibold hover:bg-plum-deep transition-colors shadow-cozy-sm"
          >
            <MicIcon className="w-5 h-5" />
            Start recording
          </button>
        ) : phase === "recording" ? (
          <button
            onClick={stopRecording}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-full bg-rust text-cream font-sans text-sm font-semibold hover:bg-rust/90 transition-colors shadow-cozy-sm"
          >
            <span className="w-3 h-3 rounded-sm bg-cream" />
            Stop recording
          </button>
        ) : phase === "preview" && blob ? (
          <div className="space-y-3">
            <audio controls className="w-full" src={URL.createObjectURL(blob)} />
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={reset}
                className="px-3 py-3 rounded-full bg-sand-soft text-espresso-soft font-sans text-sm font-medium hover:bg-plum-tint hover:text-plum transition-colors"
              >
                Re-record
              </button>
              <button
                onClick={publish}
                className="px-3 py-3 rounded-full bg-plum text-cream font-sans text-sm font-semibold hover:bg-plum-deep transition-colors shadow-cozy-sm"
              >
                Publish ↗
              </button>
            </div>
          </div>
        ) : phase === "publishing" ? (
          <div className="py-3 flex items-center justify-center gap-2 text-sm text-espresso-soft">
            <span className="w-1.5 h-1.5 rounded-full bg-sienna soft-pulse" />
            Wrapping warm…
          </div>
        ) : null}

        {error && (
          <div className="px-3 py-2 rounded-2xl bg-rust-soft text-rust text-xs font-medium">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

function fmt(n: number): string {
  const m = Math.floor(n / 60);
  const s = String(n % 60).padStart(2, "0");
  return `${m}:${s}`;
}
