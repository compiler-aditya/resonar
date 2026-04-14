import { NextResponse } from "next/server";
import {
  trendingStories,
  queryStoriesByVector,
  listReactionsByGuest,
  getStory,
} from "@/lib/turbopuffer";
import { getCurrentGuest } from "@/lib/guestServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Number(url.searchParams.get("limit") || 30);
  const guest = await getCurrentGuest();

  const reactions = await listReactionsByGuest(guest.guestId, 50).catch(() => []);

  if (reactions.length === 0) {
    const trending = await trendingStories(48, limit);
    return NextResponse.json({
      mode: "trending",
      stories: trending.filter((s) => !s.id.startsWith("__warmup")),
    });
  }

  const storyVectors: number[][] = [];
  for (const r of reactions.slice(0, 20)) {
    const s = await getStory(r.story_id).catch(() => null);
    if (s?.vector?.length) storyVectors.push(s.vector);
  }
  if (storyVectors.length === 0) {
    const trending = await trendingStories(48, limit);
    return NextResponse.json({
      mode: "trending",
      stories: trending.filter((s) => !s.id.startsWith("__warmup")),
    });
  }

  const taste = averageVectors(storyVectors);
  const stories = await queryStoriesByVector(taste, {
    limit,
    excludeGuestId: guest.guestId,
    publicOnly: true,
  });
  return NextResponse.json({
    mode: "for-you",
    stories: stories.filter((s) => !s.id.startsWith("__warmup")),
  });
}

function averageVectors(vectors: number[][]): number[] {
  const dim = vectors[0].length;
  const sum = new Array<number>(dim).fill(0);
  for (const v of vectors) {
    for (let i = 0; i < dim; i++) sum[i] += v[i];
  }
  const avg = sum.map((x) => x / vectors.length);
  let norm = 0;
  for (const x of avg) norm += x * x;
  const n = Math.sqrt(norm) || 1;
  return avg.map((x) => x / n);
}
