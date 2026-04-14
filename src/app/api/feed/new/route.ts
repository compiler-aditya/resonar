import { NextResponse } from "next/server";
import { newStories } from "@/lib/turbopuffer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Number(url.searchParams.get("limit") || 50);
  const stories = await newStories(limit);
  // Filter out the warmup row
  const filtered = stories.filter((s) => !s.id.startsWith("__warmup"));
  return NextResponse.json({ stories: filtered });
}
