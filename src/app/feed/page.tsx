"use client";

import useSWR from "swr";
import Link from "next/link";
import { useState } from "react";
import StoryCard, { type StoryCardData } from "@/components/StoryCard";
import WhisperPromptCard, { type WhisperPrompt } from "@/components/WhisperPromptCard";
import { MOOD_KEYS } from "@/lib/moods";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type Tab = "for-you" | "trending" | "new" | "mood";

const TAB_LABELS: Record<Tab, string> = {
  "for-you": "FOR YOU",
  trending: "TRENDING",
  new: "NEW",
  mood: "BY MOOD",
};

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

  const { data: promptsData } = useSWR<{ prompts: WhisperPrompt[] }>(
    "/api/prompts",
    fetcher,
    { refreshInterval: 0 },
  );
  const prompts = promptsData?.prompts?.slice(0, 1) ?? [];

  return (
    <div className="py-6 space-y-5">
      <header className="flex items-end justify-between">
        <div className="space-y-1">
          <div className="font-mono text-[11px] uppercase tracking-caps text-ink-faint flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 bg-signal vu-pulse" />
            LIVE FEED · TRANSMITTING
          </div>
          <h1 className="font-sans text-3xl font-semibold">The broadcast</h1>
        </div>
        <Link
          href="/record"
          className="inline-flex items-center gap-2 px-4 py-2 bg-ink text-paper font-mono text-[11px] uppercase tracking-caps hover:bg-signal transition-colors shadow-tape-sm"
        >
          ◉ NEW STORY
        </Link>
      </header>

      <nav className="border-y border-ink bg-paper-deep">
        <div className="flex divide-x divide-ink">
          {(Object.keys(TAB_LABELS) as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 px-3 py-2.5 font-mono text-[11px] uppercase tracking-caps transition-colors ${
                tab === t
                  ? "bg-ink text-paper"
                  : "text-ink hover:bg-ink/5"
              }`}
            >
              {tab === t ? `[${TAB_LABELS[t]}]` : TAB_LABELS[t]}
            </button>
          ))}
        </div>
      </nav>

      {tab === "mood" && (
        <div className="flex flex-wrap gap-2 font-mono text-[10px] uppercase tracking-caps">
          {MOOD_KEYS.map((m) => (
            <button
              key={m}
              onClick={() => setMood(m)}
              className={`px-3 py-1.5 border border-ink transition-colors ${
                mood === m
                  ? "bg-ink text-paper"
                  : "bg-paper text-ink hover:bg-ink hover:text-paper"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      )}

      {tab === "for-you" && data?.mode === "trending" && (
        <div className="border border-tape bg-paper-deep px-4 py-2 font-mono text-[10px] uppercase tracking-caps text-ink-faint">
          REACT TO A FEW STORIES AND FOR YOU WILL LEARN YOUR TASTE. FOR NOW, TRANSMITTING TRENDING.
        </div>
      )}

      {prompts.length > 0 && (
        <div className="space-y-3">
          {prompts.map((p) => (
            <WhisperPromptCard key={p.id} prompt={p} />
          ))}
        </div>
      )}

      {isLoading && (
        <div className="font-mono text-[11px] uppercase tracking-caps text-ink-faint flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 bg-signal vu-pulse" />
          LOADING TRANSMISSIONS…
        </div>
      )}
      {error && (
        <div className="font-mono text-[11px] uppercase tracking-caps text-signal">
          SIGNAL LOST — COULD NOT LOAD FEED
        </div>
      )}

      <div className="space-y-5">
        {data?.stories?.length ? (
          data.stories.map((s, i) => (
            <StoryCard key={s.id} story={s} trackNumber={i + 1} />
          ))
        ) : !isLoading ? (
          <div className="border border-tape bg-paper-deep px-6 py-10 text-center space-y-3">
            <div className="font-mono text-[11px] uppercase tracking-caps text-ink-faint">
              DEAD AIR · NO TRANSMISSIONS YET
            </div>
            <div>
              <Link
                href="/record"
                className="font-mono text-[11px] uppercase tracking-caps text-signal hover:underline"
              >
                [ RECORD THE FIRST STORY ▸ ]
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
