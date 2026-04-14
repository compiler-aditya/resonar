"use client";

import { useCallback, useRef, useState } from "react";
import { HeartIcon, ChatIcon, SnowflakeIcon, HugIcon, SmileIcon } from "./Icons";

export type ReactionType = "felt_this" | "laughed" | "chills" | "me_too" | "hugged";

const REACTIONS: Array<{ type: ReactionType; Icon: typeof HeartIcon; label: string }> = [
  { type: "felt_this", Icon: HeartIcon, label: "Felt this" },
  { type: "laughed", Icon: SmileIcon, label: "Laughed" },
  { type: "chills", Icon: SnowflakeIcon, label: "Chills" },
  { type: "me_too", Icon: ChatIcon, label: "Me too" },
  { type: "hugged", Icon: HugIcon, label: "Hugged" },
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
  compact = false,
}: {
  storyId: string;
  initial: ReactionCounts;
  compact?: boolean;
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

  // Show the top 2-3 reactions to match the reference layout
  const visibleReactions = compact ? REACTIONS.slice(0, 2) : REACTIONS.slice(0, 3);

  return (
    <div className="flex items-center gap-1.5">
      {visibleReactions.map((r) => {
        const isClicked = clicked === r.type;
        const count = counts[r.type];
        return (
          <button
            key={r.type}
            onClick={() => react(r.type)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-all ${
              isClicked
                ? "bg-plum text-cream scale-105"
                : "bg-sand-soft text-espresso-soft hover:bg-plum-tint hover:text-plum"
            }`}
            aria-label={r.label}
          >
            <r.Icon className="w-3.5 h-3.5" />
            <span className="font-sans text-[11px] font-semibold tabular-nums">
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
