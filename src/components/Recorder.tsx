"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const DURATIONS = [30, 60, 120, 180] as const;

export default function Recorder() {
  const router = useRouter();
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
      const res = await fetch("/api/stories", { method: "POST", body: form });
      if (!res.ok) throw new Error(await res.text());
      router.push("/feed");
    } catch (err) {
      console.error(err);
      setError((err as Error).message);
      setPhase("error");
    }
  }

  const barCount = 32;
  const bars = Array.from({ length: barCount }).map((_, i) => {
    const base = Math.min(1, level * 4);
    const jitter = (Math.sin((i + elapsed * 4) * 0.6) + 1) / 2;
    const h = phase === "recording" ? Math.max(0.12, base * (0.4 + jitter * 0.6)) : 0.1;
    return h;
  });

  return (
    <div className="max-w-xl mx-auto py-10 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-semibold">Share a voice story</h1>
        <p className="text-white/60 text-sm">
          Up to {maxSeconds}s. AI will wrap it in matching music and ambient sound.
        </p>
      </div>

      {phase === "idle" && (
        <div className="flex justify-center gap-2">
          {DURATIONS.map((d) => (
            <button
              key={d}
              onClick={() => setMaxSeconds(d)}
              className={`px-4 py-2 rounded-full text-sm border ${
                maxSeconds === d
                  ? "bg-white text-black border-white"
                  : "border-white/20 text-white/80 hover:bg-white/10"
              }`}
            >
              {d === 30 ? "30s" : d === 60 ? "1 min" : d === 120 ? "2 min" : "3 min"}
            </button>
          ))}
        </div>
      )}

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-6">
        <div className="flex items-end justify-center gap-1 h-24">
          {bars.map((h, i) => (
            <div
              key={i}
              className="w-1.5 bg-gradient-to-t from-fuchsia-400 via-sky-400 to-emerald-300 rounded-full transition-all"
              style={{ height: `${h * 100}%` }}
            />
          ))}
        </div>
        <div className="text-center text-white/80 text-sm">
          {phase === "recording" && (
            <span className="tabular-nums">
              {fmt(elapsed)} / {fmt(maxSeconds)}
            </span>
          )}
          {phase === "preview" && <span>Preview your story, then publish.</span>}
          {phase === "publishing" && <span>Publishing…</span>}
          {phase === "idle" && <span>Tap the circle to start recording.</span>}
          {phase === "error" && <span className="text-red-300">{error}</span>}
        </div>

        <div className="flex justify-center">
          {phase === "idle" || phase === "error" ? (
            <button
              onClick={startRecording}
              className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-400 transition"
              aria-label="Start recording"
            />
          ) : phase === "recording" ? (
            <button
              onClick={stopRecording}
              className="w-20 h-20 rounded-full bg-red-500 ring-8 ring-red-500/30 hover:bg-red-400 transition flex items-center justify-center"
              aria-label="Stop recording"
            >
              <span className="w-6 h-6 bg-white rounded" />
            </button>
          ) : null}
        </div>

        {phase === "preview" && blob && (
          <div className="space-y-4">
            <audio
              controls
              className="w-full"
              src={URL.createObjectURL(blob)}
            />
            <div className="flex gap-3 justify-center">
              <button
                onClick={reset}
                className="px-4 py-2 rounded-full text-sm bg-white/10 hover:bg-white/20"
              >
                Re-record
              </button>
              <button
                onClick={publish}
                className="px-5 py-2 rounded-full text-sm font-medium bg-white text-black hover:bg-white/90"
              >
                Publish story
              </button>
            </div>
          </div>
        )}

        {phase === "publishing" && (
          <div className="flex justify-center">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
