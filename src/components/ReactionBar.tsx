"use client";

import { useCallback, useRef, useState } from "react";

export type ReactionType = "felt_this" | "laughed" | "chills" | "me_too" | "hugged";

const REACTIONS: Array<{ type: ReactionType; emoji: string; label: string }> = [
  { type: "felt_this", emoji: "♡", label: "Felt this" },
  { type: "laughed", emoji: "😂", label: "Laughed" },
  { type: "chills", emoji: "❄", label: "Chills" },
  { type: "me_too", emoji: "🤝", label: "Me too" },
  { type: "hugged", emoji: "🫂", label: "Hugged" },
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
        setTimeout(() => setClicked(null), 600);
      }
    },
    [storyId, pending, play],
  );

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {REACTIONS.map((r) => {
        const isClicked = clicked === r.type;
        return (
          <button
            key={r.type}
            onClick={() => react(r.type)}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition ${
              isClicked
                ? "bg-white/20 border-white/40 scale-110"
                : "border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20"
            }`}
            aria-label={r.label}
          >
            <span>{r.emoji}</span>
            <span className="tabular-nums">{counts[r.type]}</span>
          </button>
        );
      })}
    </div>
  );
}
