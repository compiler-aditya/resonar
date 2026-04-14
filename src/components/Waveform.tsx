"use client";

import { useMemo } from "react";

interface WaveformProps {
  seed: string;
  bars?: number;
  progress?: number; // 0..1
  color?: string;
  trackColor?: string;
  height?: number;
  className?: string;
}

/**
 * Soft rounded-bar waveform in the lo-fi cassette style.
 * Deterministic per `seed` so the same story always looks identical.
 */
export default function Waveform({
  seed,
  bars = 42,
  progress = 0,
  color = "var(--sienna)",
  trackColor = "rgba(61, 47, 40, 0.12)",
  height = 40,
  className = "",
}: WaveformProps) {
  const amplitudes = useMemo(() => generateAmplitudes(seed, bars), [seed, bars]);
  const playedIndex = Math.min(bars - 1, Math.floor(progress * bars));

  return (
    <div
      className={`flex items-center gap-[3px] ${className}`}
      style={{ height }}
      aria-hidden="true"
    >
      {amplitudes.map((a, i) => {
        const h = Math.max(0.12, a) * height;
        const played = i <= playedIndex;
        return (
          <span
            key={i}
            className="flex-1 rounded-full transition-colors"
            style={{
              height: `${h}px`,
              background: played ? color : trackColor,
              display: "inline-block",
              minWidth: "3px",
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

  // Early envelope that rises quickly then tapers, for a cassette-meter feel
  return Array.from({ length: count }, (_, i) => {
    const pos = i / (count - 1);
    const envelope = Math.sin(pos * Math.PI) * 0.6 + 0.3;
    const jitter = rand();
    return Math.min(1, envelope * (0.4 + jitter * 0.8));
  });
}
