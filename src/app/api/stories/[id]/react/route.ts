import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import {
  getStory,
  incrementReactionCounter,
  insertReaction,
  type ReactionType,
} from "@/lib/turbopuffer";
import { getCurrentGuest } from "@/lib/guestServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_REACTIONS: ReactionType[] = [
  "felt_this",
  "laughed",
  "chills",
  "me_too",
  "hugged",
];

export async function POST(req: Request, ctx: { params: { id: string } }) {
  const guest = await getCurrentGuest();
  const body = (await req.json().catch(() => ({}))) as { type?: string };
  const type = body.type as ReactionType | undefined;
  if (!type || !VALID_REACTIONS.includes(type)) {
    return NextResponse.json({ error: "invalid reaction type" }, { status: 400 });
  }

  const story = await getStory(ctx.params.id);
  if (!story) return NextResponse.json({ error: "not found" }, { status: 404 });

  await incrementReactionCounter(ctx.params.id, type);
  await insertReaction({
    id: randomUUID(),
    vector: story.vector,
    story_id: ctx.params.id,
    guest_id: guest.guestId,
    reaction_type: type,
    created_at: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
