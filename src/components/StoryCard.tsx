"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import ReactionBar from "./ReactionBar";
import Waveform from "./Waveform";

export interface StoryCardData {
  id: string;
  guest_id?: string;
  username: string;
  country: string;
  emotion_primary: string;
  emotion_secondary: string;
  emotion_intensity: number;
  emotional_essence: string;
  audio_raw_url: string;
  audio_atmosphere_url?: string | null;
  duration_seconds: number;
  themes: string[];
  react_felt_this: number;
  react_laughed: number;
  react_chills: number;
  react_me_too: number;
  react_hugged: number;
  total_reactions: number;
  total_listens: number;
  created_at: string;
  thread_ids?: string[];
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface StoryCardProps {
  story: StoryCardData;
  trackNumber?: number;
}

export default function StoryCard({ story, trackNumber }: StoryCardProps) {
  const needsPolling = !story.audio_atmosphere_url;
  const { data } = useSWR(
    needsPolling ? `/api/stories/${story.id}` : null,
    fetcher,
    { refreshInterval: 5000 },
  );
  const live: StoryCardData = data?.story ?? story;
  const atmosphereReady = Boolean(live.audio_atmosphere_url);

  const [mode, setMode] = useState<"raw" | "atmosphere">("raw");
  useEffect(() => {
    if (atmosphereReady) setMode("atmosphere");
  }, [atmosphereReady]);

  const src = mode === "atmosphere" && live.audio_atmosphere_url
    ? live.audio_atmosphere_url
    : live.audio_raw_url;

  const audioRef = useRef<HTMLAudioElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onTime = () => {
      if (el.duration > 0) setProgress(el.currentTime / el.duration);
    };
    el.addEventListener("timeupdate", onTime);
    return () => el.removeEventListener("timeupdate", onTime);
  }, []);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  const trackLabel = useMemo(() => {
    if (typeof trackNumber === "number") {
      return `TRK_${String(trackNumber).padStart(2, "0")}`;
    }
    return `TRK_${live.id.slice(0, 4).toUpperCase()}`;
  }, [trackNumber, live.id]);

  const runtime = formatRuntime(live.duration_seconds);
  const mixLabel = atmosphereReady ? (mode === "atmosphere" ? "ATMOS" : "RAW") : "RAW";

  return (
    <article className="tape-card p-0 space-y-0">
      {/* Metadata strip — the cassette label */}
      <div className="flex items-stretch border-b border-ink">
        <div className="flex-1 px-4 py-2 font-mono text-[11px] uppercase tracking-caps text-ink font-mono-tight">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
            <span className="text-ink font-semibold">{trackLabel}</span>
            <span className="text-ink-faint">·</span>
            <span>{runtime}</span>
            <span className="text-ink-faint">·</span>
            <span>
              MIX:<span className="text-signal">{mixLabel}</span>
            </span>
            <span className="text-ink-faint">·</span>
            <span>{timeAgoShort(live.created_at)}</span>
          </div>
        </div>
        <div className="px-3 py-2 border-l border-ink bg-paper-deep flex items-center">
          <span className="font-mono text-[11px] uppercase tracking-caps text-signal font-semibold whitespace-nowrap">
            {live.emotion_primary}
          </span>
        </div>
      </div>

      {/* Byline row */}
      <div className="px-4 py-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-caps text-ink-faint border-b border-ink/40">
        <span className="inline-flex items-center justify-center w-4 h-4 border border-ink text-ink font-semibold text-[9px]">
          {live.username.slice(0, 1).toUpperCase()}
        </span>
        {live.guest_id ? (
          <Link
            href={`/profile/${live.guest_id}`}
            className="text-ink font-medium hover:text-signal"
          >
            {live.username.toUpperCase()}
          </Link>
        ) : (
          <span className="text-ink font-medium">{live.username.toUpperCase()}</span>
        )}
        <span>·</span>
        <span>{(live.country || "—").toUpperCase()}</span>
        {live.emotion_secondary && (
          <>
            <span>·</span>
            <span>{live.emotion_secondary}</span>
          </>
        )}
      </div>

      {/* Essence — the spoken text rendered as display sans */}
      <div className="px-4 py-5">
        <p className="font-sans text-[18px] sm:text-[20px] text-ink leading-relaxed">
          &ldquo;{live.emotional_essence || "…"}&rdquo;
        </p>
      </div>

      {/* VU waveform strip — the blocky signal trace */}
      <div className="mx-4 mb-3 px-3 py-3 border border-ink bg-ink">
        <Waveform
          seed={live.id}
          bars={64}
          progress={progress}
          color="#e8754a"
          trackColor="#3a3530"
          height={40}
        />
      </div>

      {/* Transport row */}
      <div className="px-4 pb-3 flex items-center gap-3">
        <button
          onClick={() => {
            if (!audioRef.current) return;
            if (audioRef.current.paused) audioRef.current.play();
            else audioRef.current.pause();
          }}
          className="inline-flex items-center justify-center w-8 h-8 border border-ink bg-paper hover:bg-signal hover:text-paper transition-colors font-mono text-sm"
          aria-label="Play"
        >
          ▸
        </button>
        <span className="font-mono text-[11px] uppercase tracking-caps text-ink font-mono-tight">
          {runtime} / {runtime}
        </span>
        {atmosphereReady ? (
          <div className="ml-auto inline-flex border border-ink text-[10px] font-mono uppercase tracking-caps">
            <button
              onClick={() => setMode("raw")}
              className={`px-2 py-1 ${
                mode === "raw" ? "bg-ink text-paper" : "text-ink hover:bg-ink/5"
              }`}
            >
              RAW
            </button>
            <button
              onClick={() => setMode("atmosphere")}
              className={`px-2 py-1 border-l border-ink ${
                mode === "atmosphere" ? "bg-ink text-paper" : "text-ink hover:bg-ink/5"
              }`}
            >
              ATMOS
            </button>
          </div>
        ) : (
          <div className="ml-auto font-mono text-[10px] uppercase tracking-caps text-ink-faint flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 bg-signal vu-pulse" />
            MIXING ATMOSPHERE…
          </div>
        )}
      </div>

      <audio ref={audioRef} src={src} preload="metadata" className="hidden" />

      {/* Reactions */}
      <div className="px-4 pb-3">
        <ReactionBar
          storyId={live.id}
          initial={{
            felt_this: live.react_felt_this,
            laughed: live.react_laughed,
            chills: live.react_chills,
            me_too: live.react_me_too,
            hugged: live.react_hugged,
          }}
        />
      </div>

      {/* Resonance thread strip */}
      {live.thread_ids && live.thread_ids.length > 0 && (
        <Link
          href={`/thread/${live.thread_ids[0]}`}
          className="block border-t border-ink bg-ink text-paper px-4 py-2.5 font-mono text-[11px] uppercase tracking-caps hover:bg-signal transition-colors"
        >
          ▸ RESONANCE THREAD — THIS STORY ECHOES WITH OTHERS
        </Link>
      )}
    </article>
  );
}

function formatRuntime(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function timeAgoShort(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "NOW";
  const diff = Date.now() - t;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "NOW";
  if (mins < 60) return `${mins}M`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}H`;
  const days = Math.floor(hours / 24);
  return `${days}D`;
}
