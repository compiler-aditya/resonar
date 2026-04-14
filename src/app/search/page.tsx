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
      <header className="space-y-1">
        <div className="font-mono text-[11px] uppercase tracking-caps text-ink-faint">
          SEARCH ▸ VECTOR + BM25 HYBRID
        </div>
        <h1 className="font-sans text-3xl font-semibold">Tune in by feeling</h1>
        <p className="font-sans text-ink-soft text-sm max-w-md">
          Describe a mood, a moment, or a topic. Turbopuffer fuses semantic
          vector search with BM25 full-text and returns what resonates.
        </p>
      </header>

      <div className="border border-ink bg-paper-soft">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-ink bg-paper-deep font-mono text-[11px] uppercase tracking-caps">
          <span className="text-signal">QUERY</span>
          <span className="text-ink-faint">▸</span>
          {isLoading ? (
            <span className="text-ink-faint flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 bg-signal vu-pulse" />
              SCANNING…
            </span>
          ) : (
            <span className="text-ink-faint">TYPE TO SEARCH</span>
          )}
        </div>
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder='try "what home sounds like" or "starting over"'
          className="w-full px-4 py-4 bg-transparent font-sans text-lg placeholder:text-ink-faint focus:outline-none"
        />
      </div>

      {debounced && data && (
        <div className="font-mono text-[10px] uppercase tracking-caps text-ink-faint">
          {data.stories.length} TRANSMISSION{data.stories.length === 1 ? "" : "S"} MATCH &ldquo;{debounced}&rdquo;
        </div>
      )}

      <div className="space-y-5">
        {data?.stories?.map((s, i) => (
          <StoryCard key={s.id} story={s} trackNumber={i + 1} />
        ))}
        {debounced && data && data.stories.length === 0 && !isLoading && (
          <div className="border border-tape bg-paper-deep px-6 py-10 text-center font-mono text-[11px] uppercase tracking-caps text-ink-faint">
            NO SIGNAL · NOTHING MATCHES THAT FEELING YET
          </div>
        )}
      </div>
    </div>
  );
}
