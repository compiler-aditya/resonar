import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/**
 * Apple touch icon — same VU-bar motif as the favicon, scaled for
 * homescreen shortcuts (iOS, Android, PWA).
 */
export default function AppleIcon() {
  const bars = [
    { h: 40, c: "#c4704a" },
    { h: 78, c: "#faf5ea" },
    { h: 120, c: "#faf5ea" },
    { h: 68, c: "#c4704a" },
    { h: 96, c: "#faf5ea" },
    { h: 46, c: "#c4704a" },
  ];
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#6b4a5c",
          borderRadius: 38,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 9,
          fontFamily: "sans-serif",
        }}
      >
        {bars.map((b, i) => (
          <div
            key={i}
            style={{
              width: 14,
              height: b.h,
              background: b.c,
              borderRadius: 10,
            }}
          />
        ))}
      </div>
    ),
    { ...size },
  );
}
