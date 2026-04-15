"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MicIcon, PlayIcon, PauseIcon } from "./Icons";
import { refreshGuest, useGuest } from "./UseGuest";

const MIN_SECONDS = 25;
const MAX_SECONDS = 60;

const REFERENCE_SCRIPT = `
The world is quiet when I listen. I breathe in slowly, and I notice how the warm air moves through the room. My favourite stories are the ones that feel like a letter nobody sent — honest, unguarded, a little bit afraid. When I read something that sounds true, I find myself leaning forward, as if the page itself could hear me. I want to remember this feeling: small, warm, and completely still.
`.trim();

export default function VoiceCloner() {
  const router = useRouter();
  const guest = useGuest();
  const alreadyCloned = Boolean(guest?.voiceId);

  const [phase, setPhase] = useState<"idle" | "recording" | "preview" | "uploading" | "cloned" | "error">("idle");
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
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
        : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType: mime });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const b = new Blob(chunksRef.current, { type: mime });
        setBlob(b);
        setPhase("preview");
      };
      recorder.start();
      setPhase("recording");
      tickRef.current = window.setInterval(() => {
        setElapsed((n) => {
          const next = n + 1;
          if (next >= MAX_SECONDS) stopRecording();
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

  async function upload() {
    if (!blob) return;
    if (elapsed < MIN_SECONDS) {
      setError(`Please record at least ${MIN_SECONDS} seconds.`);
      return;
    }
    setPhase("uploading");
    try {
      const form = new FormData();
      form.append("audio", blob, "reference.webm");
      const res = await fetch("/api/voice/clone", { method: "POST", body: form });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || (await res.text()));
      }
      await refreshGuest();
      setPhase("cloned");
    } catch (err) {
      console.error(err);
      setError((err as Error).message);
      setPhase("error");
    }
  }

  async function togglePreview() {
    if (previewAudioRef.current) {
      if (previewPlaying) {
        previewAudioRef.current.pause();
        setPreviewPlaying(false);
      } else {
        previewAudioRef.current.currentTime = 0;
        previewAudioRef.current.play().catch(() => {});
        setPreviewPlaying(true);
      }
      return;
    }
    setPreviewLoading(true);
    try {
      const res = await fetch(`/api/voice/preview?t=${Date.now()}`);
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "preview failed");
      const audioBlob = await res.blob();
      const url = URL.createObjectURL(audioBlob);
      const audio = new Audio(url);
      audio.onended = () => setPreviewPlaying(false);
      audio.onpause = () => setPreviewPlaying(false);
      previewAudioRef.current = audio;
      setPreviewLoading(false);
      audio.play().catch(() => {});
      setPreviewPlaying(true);
    } catch (err) {
      console.error(err);
      setError((err as Error).message);
      setPreviewLoading(false);
    }
  }

  function reclone() {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    setPreviewPlaying(false);
    reset();
  }

  const barCount = 36;
  const bars = Array.from({ length: barCount }).map((_, i) => {
    const base = Math.min(1, level * 4.5);
    const jitter = (Math.sin((i + elapsed * 4) * 0.6) + 1) / 2;
    return phase === "recording" ? Math.max(0.12, base * (0.4 + jitter * 0.6)) : 0.1;
  });

  return (
    <div className="py-3 space-y-5">
      <header className="space-y-2">
        <div className="font-sans text-[10px] font-bold tracking-[0.16em] uppercase text-sienna">
          Voice Setup
        </div>
        <h1 className="font-sans text-3xl font-semibold text-espresso">
          Teach Resonar{" "}
          <span className="serif-italic font-normal text-plum">your voice.</span>
        </h1>
        <p className="font-sans text-sm text-espresso-soft max-w-md">
          Read the paragraph below aloud for at least {MIN_SECONDS} seconds.
          Afterwards, you can type stories in any language and Resonar will
          publish them in your voice.
        </p>
      </header>

      {alreadyCloned && phase === "idle" && (
        <div className="cozy-card-tint px-4 py-3 text-sm text-espresso-soft">
          Your voice is already set up. Recording again will replace it.
        </div>
      )}

      <article className="cozy-card p-5 space-y-3">
        <div className="font-sans text-[10px] font-bold tracking-[0.16em] uppercase text-sienna">
          Read this paragraph
        </div>
        <p className="serif-italic text-espresso text-[17px] leading-[1.55]">
          &ldquo;{REFERENCE_SCRIPT}&rdquo;
        </p>
      </article>

      <div className="cozy-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                phase === "recording" ? "bg-sienna soft-pulse" : "bg-espresso/20"
              }`}
            />
            <span className="font-sans text-xs font-medium text-espresso-soft">
              {phase === "recording"
                ? "Recording"
                : phase === "preview"
                ? "Preview"
                : phase === "uploading"
                ? "Cloning your voice…"
                : phase === "cloned"
                ? "Voice cloned"
                : phase === "error"
                ? "Error"
                : "Ready"}
            </span>
          </div>
          <span className="font-sans text-sm font-semibold text-espresso tabular-nums">
            {fmt(elapsed)}{" "}
            <span className="text-espresso-faint font-normal">/ {fmt(MAX_SECONDS)}</span>
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
                  background:
                    phase === "recording"
                      ? "var(--sienna)"
                      : "rgba(61, 47, 40, 0.18)",
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
            Start reading
          </button>
        ) : phase === "recording" ? (
          <button
            onClick={stopRecording}
            disabled={elapsed < 5}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-full bg-rust text-cream font-sans text-sm font-semibold hover:bg-rust/90 transition-colors shadow-cozy-sm disabled:opacity-40"
          >
            <span className="w-3 h-3 rounded-sm bg-cream" />
            {elapsed < MIN_SECONDS ? `Keep reading (${MIN_SECONDS - elapsed}s more)` : "Stop reading"}
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
                onClick={upload}
                className="px-3 py-3 rounded-full bg-plum text-cream font-sans text-sm font-semibold hover:bg-plum-deep transition-colors shadow-cozy-sm"
              >
                Clone my voice ↗
              </button>
            </div>
          </div>
        ) : phase === "uploading" ? (
          <div className="py-3 flex items-center justify-center gap-2 text-sm text-espresso-soft">
            <span className="w-1.5 h-1.5 rounded-full bg-sienna soft-pulse" />
            Cloning your voice…
          </div>
        ) : phase === "cloned" ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-olive font-semibold">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-olive" />
              ✓ Voice cloned. Hear it back before you continue.
            </div>
            <div className="bg-plum-mist rounded-[18px] p-4 flex items-center gap-3">
              <button
                onClick={togglePreview}
                disabled={previewLoading}
                className="w-11 h-11 rounded-full bg-plum text-cream flex items-center justify-center shrink-0 hover:bg-plum-deep transition-colors shadow-cozy-sm disabled:opacity-50"
                aria-label={previewPlaying ? "Pause preview" : "Play preview"}
              >
                {previewLoading ? (
                  <span className="w-3 h-3 rounded-full bg-cream soft-pulse" />
                ) : previewPlaying ? (
                  <PauseIcon className="w-5 h-5" />
                ) : (
                  <PlayIcon className="w-5 h-5 ml-0.5" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <div className="font-sans text-[11px] uppercase tracking-[0.12em] text-plum font-semibold mb-1">
                  {previewLoading ? "Synthesising…" : previewPlaying ? "Playing preview" : "Tap to hear your voice"}
                </div>
                <p className="serif-italic text-espresso-soft text-[13px] leading-snug">
                  &ldquo;Hi — this is my voice on Resonar. Stories, wrapped warm.&rdquo;
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={reclone}
                className="px-3 py-3 rounded-full bg-sand-soft text-espresso-soft font-sans text-sm font-medium hover:bg-plum-tint hover:text-plum transition-colors"
              >
                Re-record reference
              </button>
              <button
                onClick={() => router.push("/record")}
                className="px-3 py-3 rounded-full bg-plum text-cream font-sans text-sm font-semibold hover:bg-plum-deep transition-colors shadow-cozy-sm"
              >
                Continue ↗
              </button>
            </div>
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
