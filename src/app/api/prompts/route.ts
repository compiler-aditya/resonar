import { NextResponse } from "next/server";
import { listActiveWhisperPrompts } from "@/lib/turbopuffer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const prompts = await listActiveWhisperPrompts(5).catch(() => []);
  const filtered = prompts.filter((p) => !p.id.startsWith("__warmup"));
  return NextResponse.json({ prompts: filtered });
}
