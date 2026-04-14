import { NextResponse } from "next/server";
import { trendingStories } from "@/lib/turbopuffer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const hours = Number(url.searchParams.get("hours") || 24);
  const limit = Number(url.searchParams.get("limit") || 50);
  const stories = await trendingStories(hours, limit);
  const filtered = stories.filter((s) => !s.id.startsWith("__warmup"));
  return NextResponse.json({ stories: filtered });
}
