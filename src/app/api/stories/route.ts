import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { uploadAudio } from "@/lib/storage";
import { getCurrentGuest } from "@/lib/guestServer";
import { processStoryJob } from "@/workers/processStory";
import { newStories } from "@/lib/turbopuffer";

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
    const file = form.get("audio") as File | null;
    if (!file) return NextResponse.json({ error: "missing audio" }, { status: 400 });
    const ab = await file.arrayBuffer();
    buffer = Buffer.from(ab);
    mime = file.type || "audio/webm";
    durationSeconds = Number(form.get("duration_seconds")) || 30;
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
  // In production we'd use pg-boss; for demo we run inline.
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
