import { NextResponse } from "next/server";
import { queryStoriesByVector, newStories } from "@/lib/turbopuffer";
import { embedMood } from "@/lib/moods";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: { mood: string } }) {
  const mood = ctx.params.mood.toLowerCase();
  const vec = await embedMood(mood).catch(() => null);
  if (!vec) {
    const fallback = await newStories(30);
    return NextResponse.json({
      mood,
      stories: fallback.filter((s) => !s.id.startsWith("__warmup")),
    });
  }
  const stories = await queryStoriesByVector(vec, { limit: 30, publicOnly: true });
  const filtered = stories.filter((s) => !s.id.startsWith("__warmup"));
  return NextResponse.json({ mood, stories: filtered });
}
