"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import StoryCard, { type StoryCardData } from "@/components/StoryCard";
import { SearchIcon } from "@/components/Icons";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 350);
    return () => clearTimeout(t);
  }, [q]);

  const { data, isLoading } = useSWR<{ query: string; stories: StoryCardData[] }>(
    debounced ? `/api/search?q=${encodeURIComponent(debounced)}` : null,
    fetcher,
  );

  return (
    <div className="py-3 space-y-5">
      <header className="space-y-2">
        <h1 className="font-sans text-3xl font-semibold text-espresso">
          Tune in by{" "}
          <span className="serif-italic font-normal text-plum">feeling</span>
        </h1>
        <p className="font-sans text-sm text-espresso-soft max-w-md">
          Describe a mood, a moment, or a topic. Vector search meets BM25 to find
          stories that resonate with you.
        </p>
      </header>

      <div className="cozy-card flex items-center gap-3 px-4 py-3.5">
        <SearchIcon className="w-5 h-5 text-espresso-faint shrink-0" />
        <input
          autoFocus
          dir="auto"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="try “what home sounds like”"
          className="flex-1 bg-transparent font-sans text-base placeholder:text-espresso-faint focus:outline-none"
        />
        {isLoading && (
          <span className="w-2 h-2 rounded-full bg-sienna soft-pulse" />
        )}
      </div>

      {debounced && data && (
        <div className="font-sans text-xs text-espresso-faint">
          {data.stories.length} {data.stories.length === 1 ? "story" : "stories"} resonate with &ldquo;{debounced}&rdquo;
        </div>
      )}

      <div className="space-y-4">
        {data?.stories?.map((s) => (
          <StoryCard key={s.id} story={s} />
        ))}
        {debounced && data && data.stories.length === 0 && !isLoading && (
          <div className="cozy-card p-8 text-center font-sans text-sm text-espresso-faint">
            Nothing matches that feeling yet. Be the first voice.
          </div>
        )}
      </div>
    </div>
  );
}
