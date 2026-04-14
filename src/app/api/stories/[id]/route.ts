import { NextResponse } from "next/server";
import { getStory } from "@/lib/turbopuffer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: { id: string } }) {
  const story = await getStory(ctx.params.id);
  if (!story) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ story });
}
