"use client";

import { useEffect, useRef } from "react";
import { usePlayer } from "@/lib/player";

/**
 * Single persistent audio element mounted at the root. Every StoryCard,
 * story page, thread page, and daily page routes its play button through
 * the player store, which then drives this element. Audio keeps playing
 * across page navigations because the element lives in the root layout.
 *
 * Exposes the underlying HTMLAudioElement via window.__resonarAudio so
 * components (like Waveform) can hook into it for AnalyserNode use.
 */
declare global {
  interface Window {
    __resonarAudio?: HTMLAudioElement;
  }
}

export default function GlobalAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const current = usePlayer((s) => s.current);
  const playing = usePlayer((s) => s.playing);
  const setPlaying = usePlayer((s) => s.setPlaying);
  const setProgress = usePlayer((s) => s.setProgress);

  useEffect(() => {
    if (typeof window !== "undefined" && audioRef.current) {
      window.__resonarAudio = audioRef.current;
    }
  }, []);

  // Drive play/pause from store state
  useEffect(() => {
    const el = audioRef.current;
    if (!el || !current) return;
    if (playing) {
      el.play().catch(() => setPlaying(false));
    } else {
      el.pause();
    }
  }, [playing, current, setPlaying]);

  // When source changes (new story), start playback
  useEffect(() => {
    const el = audioRef.current;
    if (!el || !current) return;
    el.src = current.src;
    el.load();
    if (playing) el.play().catch(() => setPlaying(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.key]);

  return (
    <audio
      ref={audioRef}
      crossOrigin="anonymous"
      preload="metadata"
      className="sr-only-audio"
      onPlay={() => setPlaying(true)}
      onPause={() => setPlaying(false)}
      onEnded={() => setPlaying(false)}
      onTimeUpdate={(e) => {
        const el = e.currentTarget;
        if (el.duration > 0) setProgress(el.currentTime, el.duration);
      }}
      onLoadedMetadata={(e) => {
        const el = e.currentTarget;
        setProgress(0, el.duration || 0);
      }}
    />
  );
}
