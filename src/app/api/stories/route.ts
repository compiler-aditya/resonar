import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { uploadAudio } from "@/lib/storage";
import { getCurrentGuest } from "@/lib/guestServer";
import { processStoryJob } from "@/workers/processStory";
import { newStories } from "@/lib/turbopuffer";
import { synthesizeSpeech } from "@/lib/elevenlabs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const stories = await newStories(50);
  return NextResponse.json({ stories });
}

export async function POST(req: Request) {
  const guest = await getCurrentGuest();
  const contentType = req.headers.get("content-type") || "";

  let buffer: Buffer;
  let mime: string;
  let durationSeconds: number;
  let promptId: string | undefined;

  if (contentType.startsWith("multipart/form-data")) {
    const form = await req.formData();

    // Text mode: synthesize speech in the guest's cloned voice
    const text = (form.get("text") as string | null)?.trim() || "";
    if (text) {
      if (!guest.voiceId) {
        return NextResponse.json(
          { error: "no voice cloned yet — visit /voice/setup first" },
          { status: 400 },
        );
      }
      if (text.length < 20) {
        return NextResponse.json({ error: "story is too short" }, { status: 400 });
      }
      try {
        buffer = await synthesizeSpeech(text, { voiceId: guest.voiceId });
        mime = "audio/mpeg";
        // Rough heuristic: ~155 words per minute → 2.58 chars/sec
        durationSeconds = Math.max(10, Math.min(180, Math.round(text.length / 16)));
      } catch (err) {
        console.error("[/api/stories] TTS failed", err);
        return NextResponse.json(
          { error: `Voice synthesis failed: ${(err as Error).message}` },
          { status: 500 },
        );
      }
    } else {
      // Audio mode: the recorded file
      const file = form.get("audio") as File | null;
      if (!file) return NextResponse.json({ error: "missing audio" }, { status: 400 });
      const ab = await file.arrayBuffer();
      buffer = Buffer.from(ab);
      mime = file.type || "audio/webm";
      durationSeconds = Number(form.get("duration_seconds")) || 30;
    }
    const pid = form.get("prompt_id");
    promptId = typeof pid === "string" && pid ? pid : undefined;
  } else {
    const ab = await req.arrayBuffer();
    buffer = Buffer.from(ab);
    mime = contentType || "audio/webm";
    durationSeconds = Number(req.headers.get("x-duration-seconds") || 30);
  }

  const rawId = randomUUID();
  const ext = mime.includes("webm") ? "webm" : mime.includes("wav") ? "wav" : "mp3";
  const key = `stories/pending/${rawId}.${ext}`;
  const rawAudioUrl = await uploadAudio(key, buffer, mime);

  // Kick off processing in the background (fire and forget).
  processStoryJob({
    storyJobId: rawId,
    guestId: guest.guestId,
    username: guest.username,
    rawAudioKey: key,
    rawAudioUrl,
    durationSeconds,
    promptId,
  }).catch((err) => {
    console.error("[/api/stories] processStoryJob failed", err);
  });

  return NextResponse.json({
    ok: true,
    jobId: rawId,
    rawAudioUrl,
  });
}
