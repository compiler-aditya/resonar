"use client";

import { useEffect } from "react";
import useSWR from "swr";

interface MoodPayload {
  dominant: string;
  secondary: string;
  total: number;
  hue: string;
  hueSecondary: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function MoodWash() {
  const { data } = useSWR<MoodPayload>("/api/mood", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5 * 60_000,
  });

  useEffect(() => {
    if (!data?.hue) return;
    const root = document.documentElement;
    root.style.setProperty("--mood-hue", data.hue);
    root.style.setProperty("--mood-hue-secondary", data.hueSecondary || data.hue);
    root.setAttribute("data-mood", data.dominant);
  }, [data]);

  return null;
}
