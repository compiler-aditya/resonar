import { NextResponse } from "next/server";
import { listThreads } from "@/lib/turbopuffer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Number(url.searchParams.get("limit") || 30);
  const threads = await listThreads(limit);
  const filtered = threads.filter((t) => !t.id.startsWith("__warmup"));
  return NextResponse.json({ threads: filtered });
}
