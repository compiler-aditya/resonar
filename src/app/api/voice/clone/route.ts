import { NextResponse } from "next/server";
import { getCurrentGuest, updateGuestSession } from "@/lib/guestServer";
import { cloneVoice, deleteClonedVoice } from "@/lib/elevenlabs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(req: Request) {
  const guest = await getCurrentGuest();
  const contentType = req.headers.get("content-type") || "";

  let buffer: Buffer;
  let mime: string;
  if (contentType.startsWith("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("audio") as File | null;
    if (!file) return NextResponse.json({ error: "missing audio" }, { status: 400 });
    const ab = await file.arrayBuffer();
    buffer = Buffer.from(ab);
    mime = file.type || "audio/webm";
  } else {
    const ab = await req.arrayBuffer();
    buffer = Buffer.from(ab);
    mime = contentType || "audio/webm";
  }

  if (buffer.length < 20 * 1024) {
    return NextResponse.json(
      { error: "reference audio is too short — record at least 20 seconds" },
      { status: 400 },
    );
  }

  // If this guest already has a cloned voice, delete the old one so we
  // don't leak voices on every re-clone.
  if (guest.voiceId) {
    await deleteClonedVoice(guest.voiceId);
  }

  try {
    const voiceId = await cloneVoice({
      name: `resonar-${guest.username}`.slice(0, 80),
      description: `Resonar user voice for ${guest.username}`,
      audio: buffer,
      mime,
      filename: `${guest.guestId}.${extFor(mime)}`,
    });
    const updated = await updateGuestSession({ voiceId });
    return NextResponse.json({
      ok: true,
      voiceId,
      username: updated.username,
    });
  } catch (err) {
    console.error("[voice/clone]", err);
    return NextResponse.json(
      { error: (err as Error).message || "clone failed" },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  const guest = await getCurrentGuest();
  if (guest.voiceId) {
    await deleteClonedVoice(guest.voiceId);
    await updateGuestSession({ voiceId: undefined });
  }
  return NextResponse.json({ ok: true });
}

function extFor(mime: string): string {
  if (mime.includes("webm")) return "webm";
  if (mime.includes("mp3") || mime.includes("mpeg")) return "mp3";
  if (mime.includes("wav")) return "wav";
  if (mime.includes("ogg")) return "ogg";
  return "audio";
}
