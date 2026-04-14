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
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-widest text-white/40">Today</p>
        <h1 className="text-4xl font-semibold tracking-tight">Daily Resonance</h1>
        <p className="text-white/60 text-balance">
          An AI-narrated 5-minute episode of the world&apos;s collective mood,
          stitched together from the day&apos;s most-felt stories.
        </p>
      </header>

      {isLoading && <div className="text-white/50">Loading today&apos;s episode…</div>}

      {data?.episode ? (
        <article className="rounded-3xl border border-white/10 bg-gradient-to-br from-fuchsia-500/10 via-sky-500/5 to-emerald-500/10 p-6 space-y-5">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold">{data.episode.title}</h2>
            <p className="text-white/70 text-sm leading-relaxed">
              {data.episode.shared_theme}
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-white/50">
            <span>{data.episode.story_count} voices</span>
            <span>·</span>
            <span>
              {Math.round((data.episode.thread_duration_seconds || 0) / 60)} min
            </span>
            {data.episode.countries?.length ? (
              <>
                <span>·</span>
                <span>{data.episode.countries.join(" · ")}</span>
              </>
            ) : null}
          </div>
          <audio
            controls
            autoPlay={false}
            src={data.episode.thread_audio_url}
            className="w-full"
          />
          <div className="flex gap-2 flex-wrap">
            {data.episode.story_ids?.map((id) => (
              <Link
                key={id}
                href={`/story/${id}`}
                className="text-xs px-3 py-1 rounded-full border border-white/10 text-white/70 hover:bg-white/5"
              >
                Story →
              </Link>
            ))}
          </div>
        </article>
      ) : (
        !isLoading && (
          <div className="rounded-3xl border border-white/10 p-8 text-center space-y-4">
            <div className="text-white/80 font-medium">Today&apos;s episode isn&apos;t ready yet.</div>
            <div className="text-sm text-white/50">
              Daily Resonance is produced once per day from the stories shared
              in the last 24 hours.
            </div>
            <div className="text-xs text-white/40">
              Waiting on: emotional aggregation → narrator script → Music API theme → FFmpeg assembly.
            </div>
          </div>
        )
      )}
    </div>
  );
}
