"use client";

import useSWR from "swr";
import Link from "next/link";
import { PlayIcon } from "@/components/Icons";

interface Episode {
  id: string;
  title: string;
  shared_theme: string;
  story_ids: string[];
  story_count: number;
  countries: string[];
  thread_audio_url: string;
  thread_duration_seconds: number;
  created_at: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function DailyPage() {
  const { data, isLoading } = useSWR<{ date: string; episode: Episode | null }>(
    "/api/daily",
    fetcher,
    { refreshInterval: 10000 },
  );

  return (
    <div className="py-3 space-y-6">
      <header className="space-y-2">
        <div className="font-sans text-[10px] font-bold tracking-[0.16em] uppercase text-sienna">
          Daily Resonance · {new Date().toISOString().slice(0, 10)}
        </div>
        <h1 className="font-sans text-3xl font-semibold text-espresso">
          The world,{" "}
          <span className="serif-italic font-normal text-plum">today.</span>
        </h1>
        <p className="font-sans text-sm text-espresso-soft max-w-md">
          A 5-minute episode stitched from the day&apos;s most-felt stories,
          narrated by AI.
        </p>
      </header>

      {isLoading && (
        <div className="text-espresso-faint text-sm flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-sienna soft-pulse" />
          Tuning in…
        </div>
      )}

      {data?.episode ? (
        <article className="cozy-card overflow-hidden">
          <div className="bg-plum-tint p-5 space-y-2">
            <h2 className="font-sans text-2xl font-semibold text-espresso leading-snug">
              {data.episode.title}
            </h2>
            <p dir="auto" className="serif-italic text-espresso-soft text-base leading-relaxed">
              &ldquo;{data.episode.shared_theme}&rdquo;
            </p>
            {data.episode.countries?.length ? (
              <div className="font-sans text-[10px] uppercase tracking-[0.12em] text-espresso-faint pt-1">
                voices from {data.episode.countries.join(" · ")}
              </div>
            ) : null}
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-2 text-xs text-espresso-faint">
              <PlayIcon className="w-3.5 h-3.5 text-plum" />
              <span>{data.episode.story_count} voices · {Math.round((data.episode.thread_duration_seconds || 0) / 60)} min</span>
            </div>
            <audio controls src={data.episode.thread_audio_url} className="w-full" />
            <div className="pt-3 border-t border-espresso/10 space-y-2">
              <div className="font-sans text-[10px] font-bold tracking-[0.16em] uppercase text-sienna">
                Constituent voices
              </div>
              <div className="flex flex-wrap gap-2">
                {data.episode.story_ids?.map((id, i) => (
                  <Link
                    key={id}
                    href={`/story/${id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sand-soft hover:bg-plum-tint hover:text-plum transition-colors font-sans text-xs font-medium text-espresso-soft"
                  >
                    Story {i + 1} →
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </article>
      ) : (
        !isLoading && (
          <div className="cozy-card p-8 text-center space-y-2">
            <div className="font-sans text-base font-medium text-espresso">
              Today&apos;s episode is still being mixed.
            </div>
            <p className="font-sans text-sm text-espresso-faint">
              Daily Resonance is produced once per day from the stories shared
              in the last 24 hours. Check back in a bit.
            </p>
          </div>
        )
      )}
    </div>
  );
}
