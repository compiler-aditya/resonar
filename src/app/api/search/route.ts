import { NextResponse } from "next/server";
import { hybridSearchStories } from "@/lib/turbopuffer";
import { embed } from "@/lib/gemini";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const limit = Number(url.searchParams.get("limit") || 20);
  if (!q) {
    return NextResponse.json({ query: q, stories: [] });
  }
  const vector = await embed(q);
  const stories = await hybridSearchStories(q, vector, limit);
  const filtered = stories.filter((s) => !s.id.startsWith("__warmup"));
  return NextResponse.json({ query: q, stories: filtered });
}
