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
    .map((d) => ({ emotion: d.emotion_primary, value: d.count }));

  if (normalized.length === 0) {
    return (
      <div className="text-xs text-white/50 italic py-6 text-center">
        No emotional fingerprint yet — share more stories.
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={normalized}>
          <PolarGrid stroke="rgba(255,255,255,0.1)" />
          <PolarAngleAxis
            dataKey="emotion"
            tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 12 }}
          />
          <PolarRadiusAxis
            tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
            axisLine={false}
          />
          <Radar
            name="Stories"
            dataKey="value"
            stroke="#a78bfa"
            fill="#a78bfa"
            fillOpacity={0.45}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
