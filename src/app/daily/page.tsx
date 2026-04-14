"use client";

import useSWR from "swr";
import Link from "next/link";

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
    <div className="py-10 max-w-3xl mx-auto space-y-8">
      <header className="space-y-1">
        <div className="font-mono text-[11px] uppercase tracking-caps text-ink-faint flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 bg-signal vu-pulse" />
          DAILY BROADCAST · {new Date().toISOString().slice(0, 10)}
        </div>
        <h1 className="font-sans text-4xl font-semibold tracking-tight">
          Daily Resonance
        </h1>
        <p className="font-sans text-ink-soft text-base max-w-xl">
          An AI-narrated 5-minute episode of the world&apos;s collective mood,
          stitched together from the day&apos;s most-felt stories.
        </p>
      </header>

      {isLoading && (
        <div className="font-mono text-[11px] uppercase tracking-caps text-ink-faint flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 bg-signal vu-pulse" />
          TUNING IN…
        </div>
      )}

      {data?.episode ? (
        <article className="tape-card">
          <div className="px-4 py-2 border-b border-ink bg-ink text-paper font-mono text-[11px] uppercase tracking-caps flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-signal" />
              DAILY · EPISODE
            </span>
            <span className="text-paper/60">
              {Math.round((data.episode.thread_duration_seconds || 0) / 60)} MIN · {data.episode.story_count} VOICES
            </span>
          </div>
          <div className="px-5 py-5 space-y-4">
            <h2 className="font-sans text-2xl font-semibold leading-snug">{data.episode.title}</h2>
            <p className="font-sans text-ink-soft text-[16px] leading-relaxed">
              {data.episode.shared_theme}
            </p>
            {data.episode.countries?.length ? (
              <div className="font-mono text-[10px] uppercase tracking-caps text-ink-faint">
                TRANSMITTING FROM {data.episode.countries.join(" · ")}
              </div>
            ) : null}
            <audio controls src={data.episode.thread_audio_url} className="w-full" />
            <div className="pt-2 border-t border-tape">
              <div className="font-mono text-[10px] uppercase tracking-caps text-ink-faint mb-2">
                CONSTITUENT TRACKS
              </div>
              <div className="flex flex-wrap gap-2">
                {data.episode.story_ids?.map((id, i) => (
                  <Link
                    key={id}
                    href={`/story/${id}`}
                    className="inline-flex items-center gap-2 px-3 py-1 border border-ink font-mono text-[10px] uppercase tracking-caps hover:bg-ink hover:text-paper transition-colors"
                  >
                    TRK_{String(i + 1).padStart(2, "0")} ▸
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </article>
      ) : (
        !isLoading && (
          <div className="border border-tape bg-paper-deep px-6 py-10 space-y-3">
            <div className="font-mono text-[11px] uppercase tracking-caps text-ink-faint">
              DEAD AIR · TODAY&apos;S EPISODE ISN&apos;T READY YET
            </div>
            <p className="font-sans text-ink-soft text-sm max-w-lg">
              Daily Resonance is produced once per day from the stories shared
              in the last 24 hours. Waiting on: emotional aggregation →
              narrator script → Music API theme → FFmpeg assembly.
            </p>
          </div>
        )
      )}
    </div>
  );
}
