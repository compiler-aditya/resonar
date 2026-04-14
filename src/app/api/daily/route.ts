import { NextResponse } from "next/server";
import { getThread } from "@/lib/turbopuffer";
import { dailyEchoId, todayStr } from "@/workers/dailyResonance";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const date = url.searchParams.get("date") || todayStr();
  const thread = await getThread(dailyEchoId(date)).catch(() => null);
  if (!thread) {
    return NextResponse.json({ date, episode: null });
  }
  return NextResponse.json({ date, episode: thread });
}
