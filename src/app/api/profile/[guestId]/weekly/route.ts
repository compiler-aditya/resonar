import { NextResponse } from "next/server";
import { listUserStories, aggregateEmotions } from "@/lib/turbopuffer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: { guestId: string } }) {
  const { guestId } = ctx.params;
  const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();

  const allStories = await listUserStories(guestId, 200).catch(() => []);
  const weekStories = allStories.filter(
    (s) => new Date(s.created_at).toISOString() >= weekAgo && !s.id.startsWith("__warmup"),
  );

  const username = allStories[0]?.username ?? weekStories[0]?.username ?? "Anonymous";

  const [fingerprint, worldFingerprint] = await Promise.all([
    aggregateEmotions({ guestId, sinceIso: weekAgo }).catch(() => []),
    aggregateEmotions({ sinceIso: weekAgo }).catch(() => []),
  ]);

  const cleanFingerprint = fingerprint
    .filter((r) => r.emotion_primary && r.emotion_primary !== "warmup")
    .sort((a, b) => b.count - a.count);
  const cleanWorld = worldFingerprint
    .filter((r) => r.emotion_primary && r.emotion_primary !== "warmup")
    .sort((a, b) => b.count - a.count);

  const themes: Record<string, number> = {};
  for (const s of weekStories) {
    for (const t of s.themes || []) themes[t] = (themes[t] || 0) + 1;
  }
  const topThemes = Object.entries(themes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  const totalListens = weekStories.reduce((n, s) => n + (s.total_listens || 0), 0);
  const totalReactions = weekStories.reduce((n, s) => n + (s.total_reactions || 0), 0);

  return NextResponse.json({
    guestId,
    username,
    weekStart: weekAgo,
    storyCount: weekStories.length,
    totalListens,
    totalReactions,
    dominantEmotion: cleanFingerprint[0]?.emotion_primary ?? null,
    secondaryEmotion: cleanFingerprint[1]?.emotion_primary ?? null,
    worldDominant: cleanWorld[0]?.emotion_primary ?? null,
    fingerprint: cleanFingerprint.slice(0, 6),
    themes: topThemes,
    stories: weekStories.slice(0, 5).map((s) => ({
      id: s.id,
      emotional_essence: s.emotional_essence,
      emotion_primary: s.emotion_primary,
      created_at: s.created_at,
    })),
  });
}
