import { NextResponse } from "next/server";
import { getStory, queryStoriesByVector } from "@/lib/turbopuffer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: { id: string } }) {
  const seed = await getStory(ctx.params.id);
  if (!seed) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (!seed.vector?.length) {
    return NextResponse.json({ seed, neighbors: [] });
  }
  const rows = await queryStoriesByVector(seed.vector, {
    limit: 6,
    excludeGuestId: seed.guest_id,
  });
  const neighbors = rows
    .filter((r) => r.id !== seed.id && !r.id.startsWith("__warmup"))
    .slice(0, 3);
  return NextResponse.json({ seed, neighbors });
}
