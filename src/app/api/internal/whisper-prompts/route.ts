import { NextResponse } from "next/server";
import { generateWhisperPromptsBatch } from "@/workers/whisperPrompts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function authorized(req: Request): boolean {
  const token = process.env.INTERNAL_API_TOKEN;
  if (!token) return false;
  return req.headers.get("authorization") === `Bearer ${token}`;
}

export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const prompts = await generateWhisperPromptsBatch();
    return NextResponse.json({ ok: true, count: prompts.length, prompts });
  } catch (err) {
    console.error("[whisper-prompts] error", err);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}

export async function GET(req: Request) {
  return POST(req);
}
