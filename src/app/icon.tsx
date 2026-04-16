import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/**
 * Resonar favicon: a plum rounded square with a cream + sienna VU-meter
 * motif that echoes the waveform inside every StoryCard. Readable at
 * 16px, distinctive at 32px.
 */
export default function Icon() {
  const bars = [
    { h: 7, c: "#c4704a" },
    { h: 14, c: "#faf5ea" },
    { h: 22, c: "#faf5ea" },
    { h: 12, c: "#c4704a" },
    { h: 18, c: "#faf5ea" },
    { h: 8, c: "#c4704a" },
  ];
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#6b4a5c",
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 1.5,
        }}
      >
        {bars.map((b, i) => (
          <div
            key={i}
            style={{
              width: 2.5,
              height: b.h,
              background: b.c,
              borderRadius: 2,
            }}
          />
        ))}
      </div>
    ),
    { ...size },
  );
}
