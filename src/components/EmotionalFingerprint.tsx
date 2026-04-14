"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

export interface FingerprintPoint {
  emotion_primary: string;
  count: number;
}

export default function EmotionalFingerprint({ data }: { data: FingerprintPoint[] }) {
  const normalized = data
    .filter((d) => d.emotion_primary && d.emotion_primary !== "warmup")
    .map((d) => ({
      emotion: d.emotion_primary.toUpperCase(),
      value: d.count,
    }));

  if (normalized.length === 0) {
    return (
      <div className="font-mono text-[11px] uppercase tracking-caps text-ink-faint py-6 text-center">
        NO FINGERPRINT YET — TRANSMIT MORE STORIES
      </div>
    );
  }

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={normalized}>
          <PolarGrid stroke="#1a1815" strokeOpacity={0.25} />
          <PolarAngleAxis
            dataKey="emotion"
            tick={{ fill: "#1a1815", fontSize: 10, fontFamily: "var(--font-plex-mono)", letterSpacing: "0.14em" }}
          />
          <PolarRadiusAxis
            tick={{ fill: "#6b645a", fontSize: 9, fontFamily: "var(--font-plex-mono)" }}
            axisLine={false}
          />
          <Radar
            name="Stories"
            dataKey="value"
            stroke="#d9571e"
            fill="#d9571e"
            fillOpacity={0.35}
            strokeWidth={1.5}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
