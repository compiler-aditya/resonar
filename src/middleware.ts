import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decodeGuest, encodeGuest, newGuestSession, GUEST_COOKIE_NAME } from "./lib/guest";

export function middleware(req: NextRequest) {
  const existing = req.cookies.get(GUEST_COOKIE_NAME)?.value;
  if (existing && decodeGuest(existing)) {
    return NextResponse.next();
  }
  const fresh = newGuestSession();
  const res = NextResponse.next();
  res.cookies.set({
    name: GUEST_COOKIE_NAME,
    value: encodeGuest(fresh),
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|reactions/|api/internal).*)"],
};
