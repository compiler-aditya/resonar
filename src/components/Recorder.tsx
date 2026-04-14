"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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
      setError((err as Error).message || "COULD NOT ACCESS MICROPHONE");
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
      setError((err as Error).message.toUpperCase());
      setPhase("error");
    }
  }

  const barCount = 36;
  const bars = Array.from({ length: barCount }).map((_, i) => {
    const base = Math.min(1, level * 4.5);
    const jitter = (Math.sin((i + elapsed * 4) * 0.6) + 1) / 2;
    const h = phase === "recording" ? Math.max(0.12, base * (0.4 + jitter * 0.6)) : 0.08;
    return h;
  });

  const fmtTime = fmt(elapsed);
  const fmtMax = fmt(maxSeconds);

  return (
    <div className="max-w-xl mx-auto py-8 space-y-6">
      <header className="space-y-1">
        <div className="font-mono text-[11px] uppercase tracking-caps text-ink-faint flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 bg-signal vu-pulse" />
          {promptId ? "RESPONDING TO A WHISPER" : "NEW TRANSMISSION"}
        </div>
        <h1 className="font-sans text-3xl font-semibold">
          {promptId ? "Answer the whisper" : "Share a voice story"}
        </h1>
        <p className="font-sans text-ink-soft text-sm max-w-md">
          Up to {maxSeconds}s. AI will wrap it in matching music and ambient
          sound after you publish.
        </p>
      </header>

      {/* Duration selector */}
      {phase === "idle" && (
        <div className="border border-ink">
          <div className="px-3 py-1.5 border-b border-ink bg-paper-deep font-mono text-[10px] uppercase tracking-caps text-ink-faint">
            RUNTIME
          </div>
          <div className="grid grid-cols-4">
            {DURATIONS.map((d, i) => (
              <button
                key={d}
                onClick={() => setMaxSeconds(d)}
                className={`px-3 py-3 font-mono text-[11px] uppercase tracking-caps ${
                  i > 0 ? "border-l border-ink" : ""
                } ${
                  maxSeconds === d
                    ? "bg-ink text-paper"
                    : "bg-paper text-ink hover:bg-ink/5"
                }`}
              >
                {d === 30 ? "30 SEC" : d === 60 ? "1 MIN" : d === 120 ? "2 MIN" : "3 MIN"}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Deck */}
      <div className="tape-card">
        <div className="px-4 py-2 border-b border-ink bg-paper-deep flex items-center justify-between font-mono text-[11px] uppercase tracking-caps font-mono-tight">
          <div className="flex items-center gap-2">
            <span className={`inline-block w-2 h-2 ${phase === "recording" ? "bg-signal vu-pulse" : "bg-ink/30"}`} />
            <span>
              {phase === "recording"
                ? "REC ● LIVE"
                : phase === "preview"
                ? "REC ◼ STOPPED"
                : phase === "publishing"
                ? "TRANSMITTING…"
                : phase === "error"
                ? "ERROR"
                : "REC ◉ READY"}
            </span>
          </div>
          <span className="text-ink font-semibold">
            {fmtTime} / {fmtMax}
          </span>
        </div>

        {/* VU bar display */}
        <div className="mx-4 my-4 bg-ink p-3 border border-ink">
          <div className="flex items-end gap-[3px]" style={{ height: 56 }}>
            {bars.map((h, i) => (
              <span
                key={i}
                className="flex-1"
                style={{
                  height: `${Math.max(4, h * 100)}%`,
                  minWidth: "3px",
                  background: phase === "recording" ? "#e8754a" : "#3a3530",
                }}
              />
            ))}
          </div>
        </div>

        {/* Transport */}
        <div className="px-4 pb-4">
          {phase === "idle" || phase === "error" ? (
            <button
              onClick={startRecording}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-signal text-paper font-mono text-xs uppercase tracking-caps hover:bg-signal-deep transition-colors shadow-tape-sm"
            >
              <span className="inline-block w-2 h-2 rounded-full bg-paper" />
              ◉ START RECORDING
            </button>
          ) : phase === "recording" ? (
            <button
              onClick={stopRecording}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-ink text-paper font-mono text-xs uppercase tracking-caps hover:bg-signal transition-colors shadow-tape-sm"
            >
              ◼ STOP RECORDING
            </button>
          ) : phase === "preview" && blob ? (
            <div className="space-y-3">
              <audio controls className="w-full" src={URL.createObjectURL(blob)} />
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={reset}
                  className="px-3 py-2.5 border border-ink font-mono text-[11px] uppercase tracking-caps hover:bg-ink hover:text-paper transition-colors"
                >
                  [ RE-RECORD ]
                </button>
                <button
                  onClick={publish}
                  className="px-3 py-2.5 bg-signal text-paper font-mono text-[11px] uppercase tracking-caps hover:bg-signal-deep transition-colors shadow-tape-sm"
                >
                  ◉ PUBLISH TO FEED
                </button>
              </div>
            </div>
          ) : phase === "publishing" ? (
            <div className="py-4 flex items-center justify-center gap-3 font-mono text-[11px] uppercase tracking-caps text-ink">
              <span className="inline-block w-2 h-2 bg-signal vu-pulse" />
              TRANSMITTING…
            </div>
          ) : null}

          {error && (
            <div className="mt-3 px-3 py-2 border border-signal-deep bg-signal/10 font-mono text-[10px] uppercase tracking-caps text-signal-deep">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function fmt(n: number): string {
  const m = Math.floor(n / 60);
  const s = String(n % 60).padStart(2, "0");
  return `${m}:${s}`;
}
