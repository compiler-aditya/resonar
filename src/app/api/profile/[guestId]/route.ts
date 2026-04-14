import { NextResponse } from "next/server";
import { listUserStories, aggregateEmotions } from "@/lib/turbopuffer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: { guestId: string } }) {
  const { guestId } = ctx.params;
  const [stories, fingerprint] = await Promise.all([
    listUserStories(guestId, 100).catch(() => []),
    aggregateEmotions({ guestId }).catch(() => []),
  ]);
  const username = stories[0]?.username ?? "Anonymous";
  const totalListens = stories.reduce((n, s) => n + (s.total_listens || 0), 0);
  const totalReactions = stories.reduce((n, s) => n + (s.total_reactions || 0), 0);
  return NextResponse.json({
    guestId,
    username,
    storyCount: stories.length,
    totalListens,
    totalReactions,
    fingerprint,
    stories: stories.filter((s) => !s.id.startsWith("__warmup")),
  });
}
