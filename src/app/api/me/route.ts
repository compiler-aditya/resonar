import { NextResponse } from "next/server";
import { getCurrentGuest } from "@/lib/guestServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const guest = await getCurrentGuest();
  return NextResponse.json({
    guestId: guest.guestId,
    username: guest.username,
  });
}
