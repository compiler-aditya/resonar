"use client";

import useSWR from "swr";
import Link from "next/link";
import StoryCard, { type StoryCardData } from "@/components/StoryCard";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function FeedPage() {
  const { data, error, isLoading } = useSWR<{ stories: StoryCardData[] }>(
    "/api/feed/new",
    fetcher,
    { refreshInterval: 6000 },
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

      {isLoading && <div className="text-white/50">Loading…</div>}
      {error && <div className="text-red-300">Could not load feed.</div>}

      <div className="space-y-4">
        {data?.stories?.length ? (
          data.stories.map((s) => <StoryCard key={s.id} story={s} />)
        ) : !isLoading ? (
          <div className="py-16 text-center text-white/50">
            No stories yet. <Link className="underline" href="/record">Record the first one.</Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
