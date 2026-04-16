"use client";

import Link from "next/link";
import { usePlayer } from "@/lib/player";
import Waveform from "./Waveform";
import { PlayIcon, PauseIcon } from "./Icons";
import { useEffect, useState } from "react";

export default function NowPlaying() {
  const current = usePlayer((s) => s.current);
  const playing = usePlayer((s) => s.playing);
  const progress = usePlayer((s) => s.progress);
  const duration = usePlayer((s) => s.duration);
  const toggle = usePlayer((s) => s.toggle);
  const stop = usePlayer((s) => s.stop);

  const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    // pick up the global audio element once it's mounted
    if (typeof window !== "undefined") {
      setAudioEl(window.__resonarAudio ?? null);
    }
  }, [current?.key]);

  if (!current) return null;

  const pct = duration > 0 ? progress / duration : 0;

  return (
    <div
      className="fixed z-40 left-0 right-0 pointer-events-none"
      style={{ bottom: "calc(5.5rem + env(safe-area-inset-bottom))" }}
    >
      <div className="pointer-events-auto max-w-md mx-auto lg:max-w-[1280px] lg:px-6 px-4">
        <div className="lg:flex lg:justify-end">
          <div className="relative bg-cream/95 backdrop-blur-sm rounded-2xl shadow-cozy-lg border border-espresso/5 p-3 flex items-center gap-3 lg:w-[420px]">
            <button
              onClick={toggle}
              className="w-10 h-10 rounded-full bg-plum text-cream flex items-center justify-center shrink-0 hover:bg-plum-deep transition-colors shadow-cozy-sm"
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5 ml-0.5" />}
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  {current.targetUrl ? (
                    <Link
                      href={current.targetUrl}
                      className="font-sans text-[12px] font-semibold text-espresso truncate block hover:text-plum"
                    >
                      {current.title}
                    </Link>
                  ) : (
                    <div className="font-sans text-[12px] font-semibold text-espresso truncate">
                      {current.title}
                    </div>
                  )}
                  {current.subtitle && (
                    <div className="font-sans text-[10px] text-espresso-faint truncate">
                      {current.subtitle}
                    </div>
                  )}
                </div>
                <button
                  onClick={stop}
                  className="font-sans text-[10px] uppercase tracking-[0.1em] text-espresso-faint hover:text-plum shrink-0"
                  aria-label="Close player"
                >
                  ✕
                </button>
              </div>
              <div className="mt-1">
                <Waveform
                  seed={current.key}
                  bars={28}
                  progress={pct}
                  height={18}
                  audioEl={audioEl}
                  playing={playing}
                  color={current.tint || "var(--plum)"}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
