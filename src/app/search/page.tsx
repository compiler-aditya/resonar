"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import StoryCard, { type StoryCardData } from "@/components/StoryCard";

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
    <div className="py-8 space-y-6 max-w-3xl mx-auto">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Search by feeling</h1>
        <p className="text-white/60 text-sm">
          Describe a mood, a moment, or a topic. Turbopuffer fuses semantic
          vector search with BM25 to find stories that resonate.
        </p>
      </header>

      <div className="relative">
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder='Try "what home sounds like" or "starting over"'
          className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-lg placeholder:text-white/30 focus:outline-none focus:border-white/30"
        />
        {isLoading && (
          <span className="absolute right-5 top-1/2 -translate-y-1/2 text-white/40 text-xs">
            searching…
          </span>
        )}
      </div>

      {debounced && data && (
        <div className="text-xs text-white/40">
          {data.stories.length} result{data.stories.length === 1 ? "" : "s"} for &ldquo;{debounced}&rdquo;
        </div>
      )}

      <div className="space-y-4">
        {data?.stories?.map((s) => (
          <StoryCard key={s.id} story={s} />
        ))}
        {debounced && data && data.stories.length === 0 && !isLoading && (
          <div className="py-12 text-center text-white/50">
            Nothing matches that feeling yet. Be the first to share one.
          </div>
        )}
      </div>
    </div>
  );
}
