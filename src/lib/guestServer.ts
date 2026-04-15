import { cookies } from "next/headers";
import {
  GUEST_COOKIE_NAME,
  decodeGuest,
  encodeGuest,
  newGuestSession,
  type GuestSession,
} from "./guest";

export async function getCurrentGuest(): Promise<GuestSession> {
  const store = cookies();
  const raw = store.get(GUEST_COOKIE_NAME)?.value;
  if (raw) {
    const decoded = decodeGuest(raw);
    if (decoded) return decoded;
  }
  const fresh = newGuestSession();
  try {
    store.set(GUEST_COOKIE_NAME, encodeGuest(fresh), {
      httpOnly: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  } catch {
    // RSC contexts can't set cookies; middleware handles new visitors
  }
  return fresh;
}

export async function updateGuestSession(patch: Partial<GuestSession>): Promise<GuestSession> {
  const current = await getCurrentGuest();
  const next: GuestSession = { ...current, ...patch };
  const store = cookies();
  store.set(GUEST_COOKIE_NAME, encodeGuest(next), {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return next;
}
