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
 * A deterministic VU-meter-style waveform: blocky stepped bars, no curves.
 * The bar pattern is seeded from the story id so the same story always
 * looks identical between renders.
 */
export default function Waveform({
  seed,
  bars = 64,
  progress = 0,
  color = "var(--signal)",
  trackColor = "var(--tape)",
  height = 48,
  className = "",
}: WaveformProps) {
  const amplitudes = useMemo(() => generateAmplitudes(seed, bars), [seed, bars]);
  const playedIndex = Math.min(bars - 1, Math.floor(progress * bars));

  return (
    <div
      className={`flex items-end gap-[2px] ${className}`}
      style={{ height }}
      aria-hidden="true"
    >
      {amplitudes.map((a, i) => {
        const h = Math.max(0.12, a) * height;
        return (
          <span
            key={i}
            className="flex-1"
            style={{
              height: `${h}px`,
              background: i <= playedIndex ? color : trackColor,
              display: "inline-block",
              minWidth: "2px",
            }}
          />
        );
      })}
    </div>
  );
}

function generateAmplitudes(seed: string, count: number): number[] {
  // Mulberry32 PRNG seeded by a hash of the story id
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

  // Produce a shape that rises to a peak in the middle then tapers,
  // modulated by pseudo-random noise for VU-meter realism.
  return Array.from({ length: count }, (_, i) => {
    const pos = i / (count - 1);
    const envelope = Math.sin(pos * Math.PI) * 0.55 + 0.25;
    const jitter = rand();
    return Math.min(1, envelope * (0.55 + jitter * 0.65));
  });
}
