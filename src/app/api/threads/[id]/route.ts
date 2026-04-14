import { NextResponse } from "next/server";
import { getThread, getStory } from "@/lib/turbopuffer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: { id: string } }) {
  const thread = await getThread(ctx.params.id);
  if (!thread) return NextResponse.json({ error: "not found" }, { status: 404 });
  const stories = await Promise.all(
    (thread.story_ids || []).map((id) => getStory(id).catch(() => null)),
  );
  return NextResponse.json({
    thread,
    stories: stories.filter(Boolean),
  });
}
