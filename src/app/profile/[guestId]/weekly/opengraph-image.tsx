import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface WeeklyLite {
  username: string;
  storyCount: number;
  dominantEmotion: string | null;
  worldDominant: string | null;
}

export default async function OG({ params }: { params: { guestId: string } }) {
  let data: WeeklyLite | null = null;
  try {
    const host = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const res = await fetch(`${host}/api/profile/${params.guestId}/weekly`, {
      cache: "no-store",
    });
    if (res.ok) data = (await res.json()) as WeeklyLite;
  } catch {
    // ignore
  }

  const username = data?.username ?? "someone";
  const mood = data?.dominantEmotion ?? "quiet";
  const count = data?.storyCount ?? 0;
  const worldMood = data?.worldDominant ?? "tender";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#e9dfc9",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          color: "#3d2f28",
          fontFamily: "sans-serif",
          backgroundImage:
            "radial-gradient(circle at 15% 5%, rgba(138, 100, 120, 0.22) 0%, transparent 50%), radial-gradient(circle at 95% 95%, rgba(196, 112, 74, 0.15) 0%, transparent 55%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 14, height: 14, background: "#6b4a5c", borderRadius: 999 }} />
          <div style={{ fontSize: 24, letterSpacing: 6, opacity: 0.6, textTransform: "uppercase" }}>
            Resonar · Weekly
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 32, color: "#8a7a6e" }}>
            {username} this week
          </div>
          <div style={{ fontSize: 68, lineHeight: 1.1, fontWeight: 600, maxWidth: 1040 }}>
            sounded like <span style={{ color: "#6b4a5c", fontStyle: "italic" }}>{mood}</span>
          </div>
          <div style={{ fontSize: 24, color: "#5c4a42", marginTop: 14 }}>
            {count} {count === 1 ? "story" : "stories"} shared · the world was mostly {worldMood}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 20,
            color: "#8a7a6e",
          }}
        >
          <div>resonar.app · stories wrapped warm</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
