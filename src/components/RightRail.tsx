"use client";

import Link from "next/link";
import useSWR from "swr";
import WhisperPromptCard, { type WhisperPrompt } from "./WhisperPromptCard";
import { PlayIcon, FlowerIcon } from "./Icons";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Episode {
  id: string;
  title: string;
  shared_theme: string;
  thread_audio_url: string;
  story_count: number;
  thread_duration_seconds: number;
}

export default function RightRail() {
  const { data: promptsData } = useSWR<{ prompts: WhisperPrompt[] }>(
    "/api/prompts",
    fetcher,
    { refreshInterval: 0 },
  );
  const { data: dailyData } = useSWR<{ episode: Episode | null }>(
    "/api/daily",
    fetcher,
    { refreshInterval: 0 },
  );

  const prompt = promptsData?.prompts?.[0];
  const episode = dailyData?.episode;

  return (
    <aside className="hidden lg:flex h-screen sticky top-0 flex-col px-5 py-7 gap-5 overflow-y-auto">
      {prompt && <WhisperPromptCard prompt={prompt} />}

      {episode ? (
        <Link
          href="/daily"
          className="cozy-card overflow-hidden block group"
        >
          <div className="bg-plum-tint p-4 space-y-1.5">
            <div className="font-sans text-[10px] font-bold tracking-[0.16em] uppercase text-sienna">
              Daily Resonance · today
            </div>
            <h3 className="font-sans text-lg font-semibold text-espresso leading-snug group-hover:text-plum transition-colors">
              {episode.title}
            </h3>
          </div>
          <div className="p-4 space-y-2">
            <p className="serif-italic text-espresso-soft text-[13px] leading-relaxed line-clamp-3">
              &ldquo;{episode.shared_theme}&rdquo;
            </p>
            <div className="flex items-center gap-2 text-espresso-faint text-[11px] font-medium">
              <PlayIcon className="w-3 h-3 text-plum" />
              <span>
                {episode.story_count} voices ·{" "}
                {Math.round((episode.thread_duration_seconds || 0) / 60)} min
              </span>
            </div>
          </div>
        </Link>
      ) : (
        <article className="cozy-card p-4 space-y-2">
          <div className="font-sans text-[10px] font-bold tracking-[0.16em] uppercase text-sienna">
            Daily Resonance
          </div>
          <p className="font-sans text-sm text-espresso-soft leading-relaxed">
            Today&apos;s episode is being mixed. Once a day, an AI narrator
            stitches the world&apos;s most-felt voices into a 5-minute broadcast.
          </p>
          <Link
            href="/daily"
            className="inline-block font-sans text-xs font-semibold text-plum hover:text-plum-deep mt-1"
          >
            Tune in →
          </Link>
        </article>
      )}

      <article className="cozy-card-tint p-4 space-y-2 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-20 h-20 rounded-full bg-plum-mist opacity-60 -translate-y-6 translate-x-6" />
        <div className="flex items-center gap-1.5 font-sans text-[10px] font-bold tracking-[0.16em] uppercase text-olive relative">
          <FlowerIcon className="w-3.5 h-3.5" />
          About Resonance Threads
        </div>
        <p className="font-sans text-[13px] text-espresso-soft leading-relaxed relative">
          When your story echoes with someone else&apos;s, AI weaves you into
          a continuous thread — a mix of voices that share the same emotional
          frequency.
        </p>
      </article>
    </aside>
  );
}
