"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import ReactionBar from "./ReactionBar";
import Waveform from "./Waveform";
import { PlayIcon, PauseIcon, FlowerIcon } from "./Icons";

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
}

export default function StoryCard({ story }: StoryCardProps) {
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
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onTime = () => {
      if (el.duration > 0) setProgress(el.currentTime / el.duration);
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onPause);
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onPause);
    };
  }, []);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.load();
    setProgress(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  const togglePlay = () => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) el.play().catch(() => {});
    else el.pause();
  };

  const initial = live.username.slice(0, 1).toUpperCase();
  const avatarColor = useMemo(() => avatarColorFor(live.emotion_primary), [live.emotion_primary]);
  const primaryChip = emotionChipStyle(live.emotion_primary);
  const secondaryChip = live.emotion_secondary
    ? emotionChipStyle(live.emotion_secondary)
    : null;
  const runtime = formatRuntime(live.duration_seconds);

  return (
    <article className="cozy-card p-5 space-y-4">
      {/* Header: avatar + username + emotion chips */}
      <header className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-cream font-semibold text-sm shrink-0"
          style={{ background: avatarColor }}
        >
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            {live.guest_id ? (
              <Link
                href={`/profile/${live.guest_id}`}
                className="font-sans font-semibold text-espresso text-[14px] hover:text-plum transition-colors min-w-0 truncate"
              >
                {live.username}
              </Link>
            ) : (
              <div className="font-sans font-semibold text-espresso text-[14px] truncate">
                {live.username}
              </div>
            )}
            <div className="flex items-center gap-1 shrink-0">
              <EmotionChip label={live.emotion_primary} style={primaryChip} />
              {secondaryChip && (
                <EmotionChip label={live.emotion_secondary} style={secondaryChip} />
              )}
            </div>
          </div>
          <div className="font-sans text-[10px] tracking-[0.1em] uppercase text-espresso-faint mt-0.5">
            {live.country || "—"} · {timeAgoShort(live.created_at)}
          </div>
        </div>
      </header>

      {/* Essence — the pull-quote */}
      <p className="serif-italic text-espresso text-[17px] sm:text-[18px] leading-[1.55] pr-1">
        &ldquo;{live.emotional_essence || "…"}&rdquo;
      </p>

      {/* Player strip */}
      <div className="bg-plum-mist rounded-[18px] p-3 flex items-center gap-3">
        <button
          onClick={togglePlay}
          className="w-11 h-11 rounded-full bg-plum text-cream flex items-center justify-center shrink-0 hover:bg-plum-deep transition-colors shadow-cozy-sm"
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5 ml-0.5" />}
        </button>
        <div className="flex-1 min-w-0">
          <Waveform
            seed={live.id}
            bars={36}
            progress={progress}
            height={34}
          />
          <div className="flex items-center justify-between mt-1">
            <span className="font-sans text-[11px] text-espresso-faint font-medium tabular-nums">
              {runtime}
            </span>
            {atmosphereReady ? (
              <button
                onClick={() => setMode(mode === "raw" ? "atmosphere" : "raw")}
                className="font-sans text-[10px] uppercase tracking-[0.12em] text-espresso-faint hover:text-plum transition-colors"
              >
                {mode === "atmosphere" ? "with atmosphere" : "raw voice"}
              </button>
            ) : (
              <span className="font-sans text-[10px] uppercase tracking-[0.12em] text-espresso-faint flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-sienna soft-pulse" />
                wrapping warm…
              </span>
            )}
          </div>
        </div>
      </div>

      <audio ref={audioRef} src={src} preload="metadata" className="sr-only-audio" />

      {/* Reactions + thread link */}
      <div className="flex items-center justify-between gap-3 pt-1">
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
        {live.thread_ids && live.thread_ids.length > 0 && (
          <Link
            href={`/thread/${live.thread_ids[0]}`}
            className="flex items-center gap-1 font-sans text-[9px] uppercase tracking-[0.1em] font-semibold text-olive hover:text-espresso transition-colors shrink-0"
          >
            <FlowerIcon className="w-3.5 h-3.5" />
            Thread
          </Link>
        )}
      </div>
    </article>
  );
}

function EmotionChip({
  label,
  style,
}: {
  label: string;
  style: { bg: string; fg: string };
}) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 font-sans text-[9px] font-bold uppercase tracking-[0.12em]"
      style={{ background: style.bg, color: style.fg }}
    >
      {label}
    </span>
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
  if (Number.isNaN(t)) return "just now";
  const diff = Date.now() - t;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function avatarColorFor(emotion: string): string {
  const map: Record<string, string> = {
    nostalgia: "#6b4a5c",
    joy: "#c4803a",
    grief: "#8b3a2c",
    tenderness: "#b04b5e",
    loneliness: "#4f5b70",
    anger: "#a03828",
    gratitude: "#6a7548",
    anxiety: "#c4704a",
    excitement: "#a74e5c",
    defiance: "#8a4820",
  };
  return map[emotion.toLowerCase()] || "#6b4a5c";
}

function emotionChipStyle(emotion: string): { bg: string; fg: string } {
  const e = emotion.toLowerCase();
  const map: Record<string, { bg: string; fg: string }> = {
    nostalgia: { bg: "#f2d5db", fg: "#b04b5e" },
    tenderness: { bg: "#f2d5db", fg: "#b04b5e" },
    joy: { bg: "#f2dfb6", fg: "#a06320" },
    excitement: { bg: "#f2dfb6", fg: "#a06320" },
    gratitude: { bg: "#d6e2d3", fg: "#4a6a4c" },
    hope: { bg: "#d6e2d3", fg: "#4a6a4c" },
    grief: { bg: "#eecac3", fg: "#8b3a2c" },
    anger: { bg: "#eecac3", fg: "#8b3a2c" },
    loneliness: { bg: "#d4d9e2", fg: "#4a5466" },
    anxiety: { bg: "#f0dbc4", fg: "#8a4820" },
    defiance: { bg: "#f0dbc4", fg: "#8a4820" },
  };
  return map[e] || { bg: "#e8dfe2", fg: "#6b4a5c" };
}
