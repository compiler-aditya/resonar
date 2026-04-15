"use client";

import useSWR, { mutate } from "swr";

export interface Guest {
  guestId: string;
  username: string;
  voiceId?: string | null;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useGuest(): Guest | null {
  const { data } = useSWR<Guest>("/api/me", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  });
  if (!data?.guestId || !data?.username) return null;
  return data;
}

export function refreshGuest() {
  return mutate("/api/me");
}

export function initialFor(name: string): string {
  if (!name) return "·";
  const stripped = name.replace(/^[^a-zA-Z]+/, "");
  return (stripped[0] || name[0] || "·").toUpperCase();
}
