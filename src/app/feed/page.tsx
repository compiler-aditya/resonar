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
  "for-you": "for you",
  trending: "trending",
  new: "new",
  mood: "moods",
};

export default function FeedPage() {
  const [tab, setTab] = useState<Tab>("for-you");
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
    <div className="py-3 space-y-5">
      {/* Tabs — pill style */}
      <nav className="flex items-center gap-1 overflow-x-auto scrollbar-none">
        {(Object.keys(TAB_LABELS) as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              tab === t
                ? "bg-plum text-cream shadow-cozy-sm"
                : "text-espresso-soft hover:text-plum"
            }`}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </nav>

      {tab === "mood" && (
        <div className="flex flex-wrap gap-1.5">
          {MOOD_KEYS.map((m) => (
            <button
              key={m}
              onClick={() => setMood(m)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                mood === m
                  ? "bg-plum text-cream shadow-cozy-sm"
                  : "bg-cream text-espresso-soft hover:bg-plum-tint hover:text-plum"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      )}

      {tab === "for-you" && data?.mode === "trending" && (
        <div className="cozy-card-tint px-4 py-3 text-xs text-espresso-soft">
          React to a few stories and For You will learn your taste.
          For now, showing what&apos;s trending.
        </div>
      )}

      {prompts.length > 0 && prompts.map((p) => (
        <WhisperPromptCard key={p.id} prompt={p} />
      ))}

      {isLoading && (
        <div className="text-espresso-faint text-sm flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-sienna soft-pulse" />
          Tuning in…
        </div>
      )}
      {error && (
        <div className="text-rust text-sm">Signal lost — could not load feed.</div>
      )}

      <div className="space-y-4">
        {data?.stories?.length ? (
          data.stories.map((s) => <StoryCard key={s.id} story={s} />)
        ) : !isLoading ? (
          <div className="cozy-card p-8 text-center space-y-3">
            <div className="text-espresso-faint text-sm">
              Nothing here yet — be the first voice.
            </div>
            <Link
              href="/record"
              className="inline-block font-sans text-sm font-semibold text-plum hover:text-plum-deep"
            >
              Record the first story →
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
