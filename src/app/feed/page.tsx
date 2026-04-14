"use client";

import useSWR from "swr";
import Link from "next/link";
import { useState } from "react";
import StoryCard, { type StoryCardData } from "@/components/StoryCard";
import { MOOD_KEYS } from "@/lib/moods";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type Tab = "for-you" | "trending" | "new" | "mood";

export default function FeedPage() {
  const [tab, setTab] = useState<Tab>("new");
  const [mood, setMood] = useState<string>(MOOD_KEYS[0]);

  const url =
    tab === "new"
      ? "/api/feed/new"
      : tab === "trending"
      ? "/api/feed/trending"
      : tab === "for-you"
      ? "/api/feed/for-you"
      : `/api/feed/mood/${mood}`;

  const { data, error, isLoading } = useSWR<{ stories: StoryCardData[]; mode?: string }>(
    url,
    fetcher,
    { refreshInterval: 8000 },
  );

  return (
    <div className="py-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Feed</h1>
        <Link
          href="/record"
          className="text-sm px-4 py-2 bg-white text-black rounded-full font-medium"
        >
          + Share a story
        </Link>
      </header>

      <nav className="flex items-center gap-2 text-sm border-b border-white/10 pb-3">
        <TabButton active={tab === "for-you"} onClick={() => setTab("for-you")}>For You</TabButton>
        <TabButton active={tab === "trending"} onClick={() => setTab("trending")}>Trending</TabButton>
        <TabButton active={tab === "new"} onClick={() => setTab("new")}>New</TabButton>
        <TabButton active={tab === "mood"} onClick={() => setTab("mood")}>By Mood</TabButton>
      </nav>

      {tab === "mood" && (
        <div className="flex flex-wrap gap-2">
          {MOOD_KEYS.map((m) => (
            <button
              key={m}
              onClick={() => setMood(m)}
              className={`text-xs px-3 py-1.5 rounded-full border transition ${
                mood === m
                  ? "bg-white text-black border-white"
                  : "border-white/15 text-white/70 hover:bg-white/10"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      )}

      {tab === "for-you" && data?.mode === "trending" && (
        <div className="text-xs text-white/50 border border-white/10 rounded-lg px-3 py-2">
          React to a few stories and For You will learn your taste.
          For now, showing what&apos;s trending.
        </div>
      )}

      {isLoading && <div className="text-white/50">Loading…</div>}
      {error && <div className="text-red-300">Could not load feed.</div>}

      <div className="space-y-4">
        {data?.stories?.length ? (
          data.stories.map((s) => <StoryCard key={s.id} story={s} />)
        ) : !isLoading ? (
          <div className="py-16 text-center text-white/50">
            Nothing here yet.{" "}
            <Link className="underline" href="/record">Record a story.</Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full transition ${
        active ? "bg-white text-black" : "text-white/70 hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}
