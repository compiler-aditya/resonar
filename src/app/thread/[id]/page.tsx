"use client";

import useSWR from "swr";
import Link from "next/link";
import type { StoryCardData } from "@/components/StoryCard";

interface ThreadData {
  id: string;
  title: string;
  shared_theme: string;
  story_ids: string[];
  story_count: number;
  countries: string[];
  thread_audio_url: string;
  thread_duration_seconds: number;
  total_listens: number;
  total_reactions: number;
  created_at: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ThreadPage({ params }: { params: { id: string } }) {
  const { data, error, isLoading } = useSWR<{
    thread: ThreadData;
    stories: StoryCardData[];
  }>(`/api/threads/${params.id}`, fetcher, { refreshInterval: 0 });

  if (isLoading) return <div className="py-10 text-white/50">Loading…</div>;
  if (error || !data?.thread)
    return <div className="py-10 text-red-300">Thread not found.</div>;

  const { thread, stories } = data;

  return (
    <div className="py-10 max-w-3xl mx-auto space-y-8">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-widest text-white/40">
          Resonance Thread
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-balance">
          {thread.title}
        </h1>
        <p className="text-white/70 text-balance">{thread.shared_theme}</p>
        <div className="flex items-center gap-3 text-xs text-white/50">
          <span>{thread.story_count} voices</span>
          <span>·</span>
          <span>{(thread.countries || []).join(" · ") || "—"}</span>
          <span>·</span>
          <span>{Math.round(thread.thread_duration_seconds / 60)} min</span>
        </div>
      </header>

      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
        <audio controls src={thread.thread_audio_url} className="w-full" />
        <p className="text-xs text-white/50">
          Continuous mix: all voices stitched together with AI-generated
          musical bridges.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm uppercase tracking-widest text-white/40">
          The voices
        </h2>
        <div className="space-y-2">
          {stories.map((s, i) => (
            <Link
              key={s.id}
              href={`/story/${s.id}`}
              className="flex items-start gap-3 rounded-2xl border border-white/10 p-4 hover:bg-white/5 transition"
            >
              <span className="text-white/30 tabular-nums text-xs pt-0.5">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2 text-xs text-white/60">
                  <span className="text-white/90 font-medium">{s.username}</span>
                  <span>·</span>
                  <span>{s.country}</span>
                  <span>·</span>
                  <span className="uppercase tracking-wide">
                    {s.emotion_primary}
                  </span>
                </div>
                <p className="text-sm text-white/80 line-clamp-2">
                  {s.emotional_essence}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
