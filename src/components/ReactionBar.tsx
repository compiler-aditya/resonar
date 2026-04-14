"use client";

import { useCallback, useRef, useState } from "react";

export type ReactionType = "felt_this" | "laughed" | "chills" | "me_too" | "hugged";

const REACTIONS: Array<{ type: ReactionType; glyph: string; label: string }> = [
  { type: "felt_this", glyph: "♡", label: "FELT" },
  { type: "laughed", glyph: "笑", label: "LAUGH" },
  { type: "chills", glyph: "❄", label: "CHILLS" },
  { type: "me_too", glyph: "⧗", label: "ME-TOO" },
  { type: "hugged", glyph: "◉", label: "HUG" },
];

export interface ReactionCounts {
  felt_this: number;
  laughed: number;
  chills: number;
  me_too: number;
  hugged: number;
}

export default function ReactionBar({
  storyId,
  initial,
}: {
  storyId: string;
  initial: ReactionCounts;
}) {
  const [counts, setCounts] = useState<ReactionCounts>(initial);
  const [pending, setPending] = useState<ReactionType | null>(null);
  const [clicked, setClicked] = useState<ReactionType | null>(null);
  const audioCache = useRef<Map<ReactionType, HTMLAudioElement>>(new Map());

  const play = useCallback((type: ReactionType) => {
    let el = audioCache.current.get(type);
    if (!el) {
      el = new Audio(`/reactions/${type}.mp3`);
      el.volume = 0.8;
      audioCache.current.set(type, el);
    }
    el.currentTime = 0;
    el.play().catch(() => {});
  }, []);

  const react = useCallback(
    async (type: ReactionType) => {
      if (pending) return;
      setPending(type);
      setClicked(type);
      play(type);
      setCounts((c) => ({ ...c, [type]: c[type] + 1 }));
      try {
        await fetch(`/api/stories/${storyId}/react`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ type }),
        });
      } catch {
        setCounts((c) => ({ ...c, [type]: Math.max(0, c[type] - 1) }));
      } finally {
        setPending(null);
        setTimeout(() => setClicked(null), 500);
      }
    },
    [storyId, pending, play],
  );

  return (
    <div className="grid grid-cols-5 border border-ink font-mono text-[10px] uppercase tracking-caps font-mono-tight">
      {REACTIONS.map((r, i) => {
        const isClicked = clicked === r.type;
        return (
          <button
            key={r.type}
            onClick={() => react(r.type)}
            className={`flex items-center justify-center gap-1.5 px-2 py-1.5 transition-colors ${
              i > 0 ? "border-l border-ink" : ""
            } ${
              isClicked
                ? "bg-signal text-paper"
                : "bg-paper text-ink hover:bg-ink hover:text-paper"
            }`}
            aria-label={r.label}
          >
            <span className="text-[11px]">{r.glyph}</span>
            <span className="tabular-nums">{String(counts[r.type]).padStart(2, "0")}</span>
          </button>
        );
      })}
    </div>
  );
}
