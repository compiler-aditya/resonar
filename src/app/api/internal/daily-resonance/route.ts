import { NextResponse } from "next/server";
import { generateDailyResonance } from "@/workers/dailyResonance";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 600;

function authorized(req: Request): boolean {
  const token = process.env.INTERNAL_API_TOKEN;
  if (!token) return false;
  const header = req.headers.get("authorization") || "";
  return header === `Bearer ${token}`;
}

export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  const date = url.searchParams.get("date") || undefined;
  const force = url.searchParams.get("force") === "1";
  try {
    const result = await generateDailyResonance({ date, force });
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    console.error("[daily-resonance] error", err);
    return NextResponse.json(
      { error: (err as Error).message || "generation failed" },
      { status: 500 },
    );
  }
}

export async function GET(req: Request) {
  return POST(req);
}
