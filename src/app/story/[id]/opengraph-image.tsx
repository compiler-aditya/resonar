import { ImageResponse } from "next/og";
import { getStory } from "@/lib/turbopuffer";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage({ params }: { params: { id: string } }) {
  const story = await getStory(params.id).catch(() => null);
  const username = story?.username ?? "Anonymous";
  const essence = story?.emotional_essence ?? "A voice story on Resonar.";
  const emotion = story?.emotion_primary ?? "reflection";
  const country = story?.country ?? "";
  const themes = (story?.themes ?? []).slice(0, 3);

  const moodColor = emotionToColor(emotion);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0b0b10",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          color: "white",
          fontFamily: "sans-serif",
          backgroundImage: `radial-gradient(circle at 20% 30%, ${moodColor}22 0%, transparent 50%), radial-gradient(circle at 80% 70%, ${moodColor}15 0%, transparent 60%)`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 20,
              height: 20,
              background: moodColor,
              borderRadius: 999,
            }}
          />
          <div style={{ fontSize: 26, letterSpacing: 6, opacity: 0.6, textTransform: "uppercase" }}>
            Resonar
          </div>
          <div style={{ marginLeft: "auto", fontSize: 24, opacity: 0.5 }}>{emotion}</div>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 56,
            lineHeight: 1.2,
            fontWeight: 600,
            maxWidth: 1000,
          }}
        >
          {truncate(essence, 180)}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 28, opacity: 0.75 }}>
          <div>{username}</div>
          {country && <div style={{ opacity: 0.5 }}>·</div>}
          {country && <div>{country}</div>}
          {themes.length > 0 && <div style={{ opacity: 0.5 }}>·</div>}
          {themes.length > 0 && <div style={{ opacity: 0.7 }}>{themes.join(" · ")}</div>}
        </div>
      </div>
    ),
    { ...size },
  );
}

function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return s.slice(0, n - 1).trimEnd() + "…";
}

function emotionToColor(emotion: string): string {
  const palette: Record<string, string> = {
    joy: "#fcd34d",
    loneliness: "#60a5fa",
    nostalgia: "#c084fc",
    grief: "#6b7280",
    anger: "#ef4444",
    tenderness: "#f472b6",
    gratitude: "#34d399",
    anxiety: "#f59e0b",
    excitement: "#22d3ee",
    defiance: "#fb923c",
  };
  return palette[emotion.toLowerCase()] || "#a78bfa";
}
