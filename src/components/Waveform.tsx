"use client";

import { useEffect, useMemo, useRef, useState } from "react";

interface WaveformProps {
  seed: string;
  bars?: number;
  progress?: number;
  /** When provided + playing=true, the waveform pulses to the actual audio frequencies via AnalyserNode. */
  audioEl?: HTMLAudioElement | null;
  playing?: boolean;
  color?: string;
  trackColor?: string;
  height?: number;
  className?: string;
}

// One AudioContext + one MediaElementAudioSourceNode per audio element, globally.
const sourceRegistry = new WeakMap<
  HTMLAudioElement,
  { ctx: AudioContext; source: MediaElementAudioSourceNode }
>();

function ensureSource(el: HTMLAudioElement) {
  const cached = sourceRegistry.get(el);
  if (cached) return cached;
  const AC = (window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
  const ctx = new AC();
  const source = ctx.createMediaElementSource(el);
  source.connect(ctx.destination);
  sourceRegistry.set(el, { ctx, source });
  return { ctx, source };
}

export default function Waveform({
  seed,
  bars = 42,
  progress = 0,
  audioEl,
  playing = false,
  color = "var(--sienna)",
  trackColor = "rgba(61, 47, 40, 0.12)",
  height = 40,
  className = "",
}: WaveformProps) {
  const [liveBars, setLiveBars] = useState<number[] | null>(null);
  const staticAmps = useMemo(() => generateAmplitudes(seed, bars), [seed, bars]);
  const rafRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    if (!audioEl || !playing) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      // gentle fade back to static shape
      setLiveBars(null);
      return;
    }

    let cancelled = false;
    try {
      const { ctx, source } = ensureSource(audioEl);
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.72;
      source.connect(analyser);
      analyserRef.current = analyser;

      const data = new Uint8Array(analyser.frequencyBinCount);
      const loop = () => {
        if (cancelled || !analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(data);
        const result = new Array<number>(bars);
        // Focus on the lower 3/4 of frequency bins where voice energy lives.
        const usable = Math.floor(data.length * 0.78);
        for (let i = 0; i < bars; i++) {
          const lo = Math.floor((i / bars) * usable);
          const hi = Math.floor(((i + 1) / bars) * usable);
          let sum = 0;
          let count = 0;
          for (let j = lo; j <= hi && j < usable; j++) {
            sum += data[j];
            count++;
          }
          const avg = count ? sum / count : 0;
          result[i] = Math.min(1, (avg / 255) * 1.35);
        }
        setLiveBars(result);
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
    } catch (err) {
      console.warn("[Waveform] AnalyserNode setup failed — falling back to static", err);
    }

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      try {
        analyserRef.current?.disconnect();
      } catch {
        // ignore
      }
      analyserRef.current = null;
    };
  }, [audioEl, playing, bars]);

  const amps = liveBars ?? staticAmps;
  const playedIndex = Math.min(bars - 1, Math.floor(progress * bars));

  return (
    <div
      className={`flex items-center gap-[3px] ${className}`}
      style={{ height }}
      aria-hidden="true"
    >
      {amps.map((a, i) => {
        const h = Math.max(0.12, a) * height;
        const played = i <= playedIndex;
        return (
          <span
            key={i}
            className="flex-1 rounded-full"
            style={{
              height: `${h}px`,
              background: played ? color : trackColor,
              display: "inline-block",
              minWidth: "3px",
              transition: liveBars ? "height 60ms linear" : "height 160ms ease-out, background 200ms",
            }}
          />
        );
      })}
    </div>
  );
}

function generateAmplitudes(seed: string, count: number): number[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let s = h >>> 0;
  const rand = () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return Array.from({ length: count }, (_, i) => {
    const pos = i / (count - 1);
    const envelope = Math.sin(pos * Math.PI) * 0.6 + 0.3;
    const jitter = rand();
    return Math.min(1, envelope * (0.4 + jitter * 0.8));
  });
}
