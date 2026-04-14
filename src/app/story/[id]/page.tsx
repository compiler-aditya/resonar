"use client";

import useSWR from "swr";
import StoryCard, { type StoryCardData } from "@/components/StoryCard";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function StoryPage({ params }: { params: { id: string } }) {
  const { data, error, isLoading } = useSWR<{ story: StoryCardData }>(
    `/api/stories/${params.id}`,
    fetcher,
    { refreshInterval: 5000 },
  );

  if (isLoading) return <div className="py-10 text-white/50">Loading…</div>;
  if (error || !data?.story)
    return <div className="py-10 text-red-300">Could not load story.</div>;

  return (
    <div className="py-10 max-w-2xl mx-auto">
      <StoryCard story={data.story} />
    </div>
  );
}
