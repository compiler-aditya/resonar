import { NextResponse } from "next/server";
import { aggregateEmotions } from "@/lib/turbopuffer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMOTION_HUES: Record<string, string> = {
  joy: "38 80% 60%",          // warm amber
  excitement: "24 86% 60%",
  nostalgia: "325 45% 55%",   // dusty rose
  tenderness: "340 45% 60%",
  longing: "285 35% 55%",     // plum
  loneliness: "215 35% 55%",  // muted blue
  grief: "0 40% 40%",         // deep rust
  anger: "8 68% 45%",
  gratitude: "90 35% 45%",    // olive
  hope: "155 40% 50%",
  defiance: "18 70% 50%",
  anxiety: "35 45% 50%",
  fear: "260 30% 45%",
  awe: "200 50% 55%",
  love: "350 60% 60%",
  pride: "48 65% 55%",
  shame: "350 25% 40%",
  contentment: "60 35% 50%",
};

export async function GET() {
  try {
    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const rows = await aggregateEmotions({ sinceIso: since });
    const clean = rows
      .filter((r) => r.emotion_primary && r.emotion_primary !== "warmup")
      .sort((a, b) => b.count - a.count);

    const dominant = clean[0]?.emotion_primary ?? "tenderness";
    const secondary = clean[1]?.emotion_primary ?? "longing";
    const total = clean.reduce((n, r) => n + r.count, 0);

    return NextResponse.json(
      {
        dominant,
        secondary,
        total,
        hue: EMOTION_HUES[dominant] || EMOTION_HUES.tenderness,
        hueSecondary: EMOTION_HUES[secondary] || EMOTION_HUES.longing,
      },
      { headers: { "cache-control": "public, s-maxage=300" } },
    );
  } catch (err) {
    console.error("[mood]", err);
    return NextResponse.json(
      {
        dominant: "tenderness",
        secondary: "longing",
        total: 0,
        hue: EMOTION_HUES.tenderness,
        hueSecondary: EMOTION_HUES.longing,
      },
      { status: 200 },
    );
  }
}
