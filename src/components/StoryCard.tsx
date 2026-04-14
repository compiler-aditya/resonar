"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import ReactionBar from "./ReactionBar";

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

export default function StoryCard({ story }: { story: StoryCardData }) {
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
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onPause);
    return () => {
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onPause);
    };
  }, []);

  useEffect(() => {
    if (!audioRef.current) return;
    const wasPlaying = playing;
    audioRef.current.load();
    if (wasPlaying) audioRef.current.play().catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  const moodColor = useMemo(() => emotionToColor(live.emotion_primary), [live.emotion_primary]);

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
      <header className="flex items-center justify-between text-xs text-white/60">
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ backgroundColor: moodColor }}
          />
          {live.guest_id ? (
            <Link
              href={`/profile/${live.guest_id}`}
              className="text-white/90 font-medium hover:underline"
            >
              {live.username}
            </Link>
          ) : (
            <span className="text-white/90 font-medium">{live.username}</span>
          )}
          <span>·</span>
          <span>{live.country || "—"}</span>
          <span>·</span>
          <span>{timeAgo(live.created_at)}</span>
        </div>
        <div className="uppercase tracking-wide text-white/50">
          {live.emotion_primary}
          {live.emotion_secondary ? ` · ${live.emotion_secondary}` : ""}
        </div>
      </header>

      <p className="text-white/90 leading-relaxed">{live.emotional_essence || "…"}</p>

      <div className="flex flex-wrap gap-1.5">
        {live.themes.slice(0, 4).map((t) => (
          <span key={t} className="text-xs px-2 py-0.5 rounded-full border border-white/10 text-white/60">
            {t}
          </span>
        ))}
      </div>

      <audio ref={audioRef} src={src} preload="none" controls className="w-full" />

      <div className="flex items-center justify-between text-xs gap-2">
        <div className="flex gap-2">
          <button
            onClick={() => setMode("raw")}
            className={`px-3 py-1 rounded-full ${
              mode === "raw" ? "bg-white text-black" : "bg-white/10 text-white/70"
            }`}
          >
            Raw voice
          </button>
          <button
            onClick={() => atmosphereReady && setMode("atmosphere")}
            disabled={!atmosphereReady}
            className={`px-3 py-1 rounded-full relative overflow-hidden ${
              mode === "atmosphere"
                ? "bg-white text-black"
                : atmosphereReady
                ? "bg-white/10 text-white/70"
                : "bg-white/5 text-white/40 cursor-not-allowed"
            }`}
          >
            {atmosphereReady ? "With atmosphere" : (
              <span className="inline-block">
                <span className="relative z-10">Atmosphere brewing…</span>
                <span className="absolute inset-0 shimmer" />
              </span>
            )}
          </button>
        </div>
        <div className="text-white/40 tabular-nums">🎧 {live.total_listens}</div>
      </div>

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
          className="block rounded-xl border border-fuchsia-400/20 bg-fuchsia-400/5 px-4 py-2.5 text-xs hover:bg-fuchsia-400/10 transition"
        >
          <span className="text-fuchsia-300">Resonance Thread →</span>{" "}
          <span className="text-white/60">
            This story echoes with others.
          </span>
        </Link>
      )}
    </article>
  );
}

function timeAgo(iso: string): string {
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

function emotionToColor(emotion: string): string {
  const palette: Record<string, string> = {
    joy: "#fcd34d",
    loneliness: "#60a5fa",
    nostalgia: "#c084fc",
    grief: "#6b7280",
    anger: "#ef4444",
    tenderness: "#f472b6",
    gratitude: "#34d399",
    anxiety: "#f59e0b",
    excitement: "#22d3ee",
    defiance: "#fb923c",
  };
  return palette[emotion.toLowerCase()] || "#a78bfa";
}
