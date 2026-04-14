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
      emotion: d.emotion_primary,
      value: d.count,
    }));

  if (normalized.length === 0) {
    return (
      <div className="text-espresso-faint text-sm py-6 text-center font-sans">
        No fingerprint yet — share more stories.
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={normalized}>
          <PolarGrid stroke="#3d2f28" strokeOpacity={0.18} />
          <PolarAngleAxis
            dataKey="emotion"
            tick={{ fill: "#5c4a42", fontSize: 11, fontFamily: "var(--font-sora)" }}
          />
          <PolarRadiusAxis
            tick={{ fill: "#8a7a6e", fontSize: 9, fontFamily: "var(--font-sora)" }}
            axisLine={false}
          />
          <Radar
            name="Stories"
            dataKey="value"
            stroke="#6b4a5c"
            fill="#6b4a5c"
            fillOpacity={0.35}
            strokeWidth={1.8}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
