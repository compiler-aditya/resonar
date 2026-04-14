import { NextResponse } from "next/server";
import { newStories } from "@/lib/turbopuffer";
import { ensureBooted } from "@/lib/bootstrap";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  ensureBooted();
  const url = new URL(req.url);
  const limit = Number(url.searchParams.get("limit") || 50);
  const stories = await newStories(limit);
  const filtered = stories.filter((s) => !s.id.startsWith("__warmup"));
  return NextResponse.json({ stories: filtered });
}
