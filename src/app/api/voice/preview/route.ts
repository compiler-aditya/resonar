import { NextResponse } from "next/server";
import { getCurrentGuest } from "@/lib/guestServer";
import { synthesizeSpeech } from "@/lib/elevenlabs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_PREVIEW = [
  "Hi — this is my voice on Resonar.",
  "Stories, wrapped warm.",
  "I can type what I want to say, and it will come back sounding like me.",
].join(" ");

export async function GET(req: Request) {
  const guest = await getCurrentGuest();
  if (!guest.voiceId) {
    return NextResponse.json(
      { error: "no voice cloned yet — visit /voice/setup first" },
      { status: 400 },
    );
  }
  const url = new URL(req.url);
  const text = (url.searchParams.get("text") || DEFAULT_PREVIEW).slice(0, 600);

  try {
    const audio = await synthesizeSpeech(text, { voiceId: guest.voiceId });
    return new NextResponse(new Uint8Array(audio), {
      status: 200,
      headers: {
        "content-type": "audio/mpeg",
        "cache-control": "no-store",
        "content-length": String(audio.length),
      },
    });
  } catch (err) {
    console.error("[voice/preview]", err);
    return NextResponse.json(
      { error: (err as Error).message || "preview failed" },
      { status: 500 },
    );
  }
}
