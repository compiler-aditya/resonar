"use client";

import useSWR from "swr";
import Link from "next/link";
import type { StoryCardData } from "@/components/StoryCard";
import { FlowerIcon } from "@/components/Icons";

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
      <div className="py-10 text-espresso-faint text-sm flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-sienna soft-pulse" />
        Tuning in…
      </div>
    );
  }
  if (error || !data?.thread) {
    return <div className="py-10 text-rust text-sm">Thread not found.</div>;
  }

  const { thread, stories } = data;

  return (
    <div className="py-3 space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2 font-sans text-[10px] font-bold tracking-[0.16em] uppercase text-olive">
          <FlowerIcon className="w-4 h-4" />
          Resonance Thread · {thread.story_count} voices
        </div>
        <h1 className="font-sans text-3xl font-semibold text-espresso text-balance leading-tight">
          {thread.title}
        </h1>
        <p dir="auto" className="serif-italic text-espresso-soft text-base leading-relaxed">
          &ldquo;{thread.shared_theme}&rdquo;
        </p>
        <div className="font-sans text-[10px] uppercase tracking-[0.12em] text-espresso-faint">
          voices from {(thread.countries || []).join(" · ") || "around the world"} · {Math.round(thread.thread_duration_seconds / 60)} min
        </div>
      </header>

      <article className="cozy-card overflow-hidden">
        <div className="bg-plum-tint p-4">
          <div className="font-sans text-[10px] font-bold tracking-[0.16em] uppercase text-plum">
            Continuous mix
          </div>
        </div>
        <div className="p-5">
          <audio controls src={thread.thread_audio_url} className="w-full" />
        </div>
      </article>

      <section className="space-y-3">
        <div className="font-sans text-[10px] font-bold tracking-[0.16em] uppercase text-sienna px-1">
          The voices
        </div>
        <div className="space-y-2">
          {stories.map((s, i) => (
            <Link
              key={s.id}
              href={`/story/${s.id}`}
              className="cozy-card flex items-start gap-4 px-4 py-4 hover:bg-cream-soft transition-colors"
            >
              <span className="font-sans text-xs text-espresso-faint pt-0.5 tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="flex-1 space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-espresso-faint">
                  <span className="font-semibold text-espresso">{s.username}</span>
                  <span>·</span>
                  <span>{s.country}</span>
                  <span>·</span>
                  <span className="text-plum font-medium">{s.emotion_primary}</span>
                </div>
                <p
                  dir="auto"
                  lang={s.language || undefined}
                  className="serif-italic text-[14px] text-espresso-soft leading-snug line-clamp-2"
                >
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
