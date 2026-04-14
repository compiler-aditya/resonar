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

  if (isLoading) {
    return (
      <div className="py-10 font-mono text-[11px] uppercase tracking-caps text-ink-faint flex items-center gap-2">
        <span className="inline-block w-1.5 h-1.5 bg-signal vu-pulse" />
        TUNING IN…
      </div>
    );
  }
  if (error || !data?.thread)
    return (
      <div className="py-10 font-mono text-[11px] uppercase tracking-caps text-signal">
        SIGNAL LOST — THREAD NOT FOUND
      </div>
    );

  const { thread, stories } = data;

  return (
    <div className="py-10 max-w-3xl mx-auto space-y-8">
      <header className="space-y-1">
        <div className="font-mono text-[11px] uppercase tracking-caps text-ink-faint flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 bg-signal vu-pulse" />
          RESONANCE THREAD · {thread.story_count} VOICES
        </div>
        <h1 className="font-sans text-4xl font-semibold tracking-tight text-balance">
          {thread.title}
        </h1>
        <p className="font-sans text-ink-soft text-base leading-relaxed text-balance max-w-xl">
          {thread.shared_theme}
        </p>
        <div className="font-mono text-[10px] uppercase tracking-caps text-ink-faint pt-1">
          TRANSMITTING FROM {(thread.countries || []).join(" · ") || "THE WORLD"} · {Math.round(thread.thread_duration_seconds / 60)} MIN
        </div>
      </header>

      <div className="tape-card">
        <div className="px-4 py-2 border-b border-ink bg-paper-deep font-mono text-[11px] uppercase tracking-caps">
          <span className="text-signal">▸</span> CONTINUOUS MIX — ALL VOICES STITCHED WITH AI MUSICAL BRIDGES
        </div>
        <div className="px-4 py-5">
          <audio controls src={thread.thread_audio_url} className="w-full" />
        </div>
      </div>

      <section className="space-y-3">
        <div className="font-mono text-[11px] uppercase tracking-caps text-ink-faint">
          THE VOICES
        </div>
        <div className="divide-y divide-ink border border-ink">
          {stories.map((s, i) => (
            <Link
              key={s.id}
              href={`/story/${s.id}`}
              className="flex items-start gap-4 px-4 py-4 bg-paper-soft hover:bg-paper-deep transition-colors"
            >
              <span className="font-mono text-[11px] uppercase tracking-caps text-ink-faint pt-1">
                TRK_{String(i + 1).padStart(2, "0")}
              </span>
              <div className="flex-1 space-y-1.5">
                <div className="font-mono text-[10px] uppercase tracking-caps text-ink-faint flex flex-wrap gap-x-2">
                  <span className="text-ink font-semibold">{s.username.toUpperCase()}</span>
                  <span>·</span>
                  <span>{s.country}</span>
                  <span>·</span>
                  <span className="text-signal">{s.emotion_primary}</span>
                </div>
                <p className="font-sans text-[15px] text-ink leading-relaxed line-clamp-2">
                  &ldquo;{s.emotional_essence}&rdquo;
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
