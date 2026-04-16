"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { StoryCardData } from "./StoryCard";

interface Props {
  open: boolean;
  seedId: string | null;
  onComplete: () => void;
}

/**
 * 10-second cinematic shown between "Publish" and "/feed".
 *
 * Stages:
 *   0:   black-to-sand fade
 *   1:   existing stories bloom as dusty dots
 *   2:   the user's new story drops in (plum, pulsing)
 *   3:   3 neighbor dots light up and lines draw from user to each
 *   4:   zoom into the closest neighbor, reveal their essence
 */
export default function PublishAnimation({ open, seedId, onComplete }: Props) {
  const [stage, setStage] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [neighbors, setNeighbors] = useState<StoryCardData[] | null>(null);
  const [allCount, setAllCount] = useState(24);

  // pre-compute pseudo-random positions for ambient background dots
  const ambientDots = useMemo(() => {
    return Array.from({ length: allCount }, (_, i) => {
      const seed = i * 9301 + 49297;
      const r = (seed % 233280) / 233280;
      const angle = r * Math.PI * 2;
      const radius = 18 + ((seed * 7919) % 32);
      return {
        x: 50 + Math.cos(angle) * radius,
        y: 50 + Math.sin(angle) * radius,
        delay: (i % 12) * 0.05,
        size: 2 + ((seed * 31) % 4),
      };
    });
  }, [allCount]);

  // positions for the 3 neighbors — spread around the user
  const neighborPositions = [
    { x: 28, y: 34 },
    { x: 72, y: 30 },
    { x: 60, y: 72 },
  ];

  useEffect(() => {
    if (!open || !seedId) return;
    let cancelled = false;
    setStage(0);
    setNeighbors(null);

    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => !cancelled && setStage(1), 350));
    timers.push(setTimeout(() => !cancelled && setStage(2), 1600));

    // Fetch neighbors in parallel. May 404 until processStory has indexed.
    const poll = async () => {
      for (let attempt = 0; attempt < 8; attempt++) {
        if (cancelled) return;
        try {
          const res = await fetch(`/api/stories/${seedId}/neighbors`);
          if (res.ok) {
            const json = (await res.json()) as { neighbors: StoryCardData[] };
            if (!cancelled && Array.isArray(json.neighbors)) {
              setNeighbors(json.neighbors);
              return;
            }
          }
        } catch {
          // ignore
        }
        await new Promise((r) => setTimeout(r, 800));
      }
    };
    poll();

    // Also fetch the current feed size so our constellation feels real.
    fetch("/api/feed/new?limit=60")
      .then((r) => r.json())
      .then((d: { stories: unknown[] }) => {
        if (!cancelled && Array.isArray(d.stories)) {
          setAllCount(Math.max(24, Math.min(60, d.stories.length + 18)));
        }
      })
      .catch(() => {});

    timers.push(setTimeout(() => !cancelled && setStage(3), 3400));
    timers.push(setTimeout(() => !cancelled && setStage(4), 5400));
    timers.push(setTimeout(() => !cancelled && onComplete(), 9000));

    return () => {
      cancelled = true;
      for (const t of timers) clearTimeout(t);
    };
  }, [open, seedId, onComplete]);

  const topNeighbor = neighbors?.[0];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[100] overflow-hidden"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, #3d2f28 0%, #1f1613 60%, #0c0807 100%)",
          }}
          aria-live="polite"
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-[min(86vw,520px)] aspect-square">
              {/* Ambient story dots */}
              {stage >= 1 &&
                ambientDots.map((d, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 0.35, scale: 1 }}
                    transition={{ duration: 0.6, delay: d.delay }}
                    className="absolute rounded-full bg-sand"
                    style={{
                      left: `${d.x}%`,
                      top: `${d.y}%`,
                      width: d.size,
                      height: d.size,
                      transform: "translate(-50%, -50%)",
                    }}
                  />
                ))}

              {/* User's new story dot — dead center */}
              {stage >= 2 && (
                <motion.div
                  key="self"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="absolute rounded-full"
                  style={{
                    left: "50%",
                    top: "50%",
                    width: 22,
                    height: 22,
                    transform: "translate(-50%, -50%)",
                    background: "#c4704a",
                    boxShadow:
                      "0 0 24px 6px rgba(196, 112, 74, 0.55), 0 0 4px 2px rgba(250, 245, 234, 0.35)",
                  }}
                >
                  <motion.span
                    className="absolute inset-0 rounded-full"
                    initial={{ scale: 1, opacity: 0.5 }}
                    animate={{ scale: 3, opacity: 0 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                    style={{ background: "#c4704a" }}
                  />
                </motion.div>
              )}

              {/* Lines to neighbors */}
              {stage >= 3 && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  {neighborPositions.map((p, i) => (
                    <motion.line
                      key={i}
                      x1="50%"
                      y1="50%"
                      x2={`${p.x}%`}
                      y2={`${p.y}%`}
                      stroke="#c4704a"
                      strokeWidth={1.2}
                      strokeOpacity={0.75}
                      strokeDasharray="4 4"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 0.75 }}
                      transition={{ duration: 0.8, delay: i * 0.2 }}
                    />
                  ))}
                </svg>
              )}

              {/* Neighbor dots */}
              {stage >= 3 &&
                neighborPositions.map((p, i) => (
                  <motion.div
                    key={`n-${i}`}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: i * 0.2 + 0.2 }}
                    className="absolute rounded-full"
                    style={{
                      left: `${p.x}%`,
                      top: `${p.y}%`,
                      width: 14,
                      height: 14,
                      transform: "translate(-50%, -50%)",
                      background: "#faf5ea",
                      boxShadow: "0 0 16px 2px rgba(250, 245, 234, 0.5)",
                    }}
                  />
                ))}
            </div>
          </div>

          {/* Captions */}
          <div className="absolute inset-x-0 bottom-0 p-8 sm:p-12 flex flex-col items-center text-center">
            <AnimatePresence mode="wait">
              {stage === 0 && (
                <motion.div
                  key="c0"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="font-sans text-[11px] uppercase tracking-[0.2em] text-sand/60"
                >
                  wrapping your story
                </motion.div>
              )}
              {stage === 1 && (
                <motion.div
                  key="c1"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="font-sans text-[11px] uppercase tracking-[0.2em] text-sand/60"
                >
                  other voices on resonar
                </motion.div>
              )}
              {stage === 2 && (
                <motion.div
                  key="c2"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="font-sans text-lg text-sand"
                >
                  You&apos;re here now.
                </motion.div>
              )}
              {stage === 3 && (
                <motion.div
                  key="c3"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="font-sans text-lg text-sand"
                >
                  Finding who else feels this…
                </motion.div>
              )}
              {stage === 4 && (
                <motion.div
                  key="c4"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="max-w-md mx-auto space-y-3"
                >
                  {topNeighbor ? (
                    <>
                      <div className="font-sans text-[11px] uppercase tracking-[0.2em] text-sienna">
                        You resonate with
                      </div>
                      <div className="font-sans text-xl text-sand font-semibold">
                        {topNeighbor.username}
                      </div>
                      <div className="font-sans text-[10px] uppercase tracking-[0.12em] text-sand/50">
                        {topNeighbor.country} · {topNeighbor.emotion_primary}
                      </div>
                      <p
                        dir="auto"
                        lang={topNeighbor.language || undefined}
                        className="serif-italic text-sand/85 text-[17px] leading-snug pt-2"
                      >
                        &ldquo;{topNeighbor.emotional_essence.slice(0, 160)}&rdquo;
                      </p>
                    </>
                  ) : (
                    <div className="font-sans text-lg text-sand">
                      You&apos;re the first voice with this feeling.
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={onComplete}
            className="absolute top-6 right-6 font-sans text-[10px] uppercase tracking-[0.2em] text-sand/50 hover:text-sand transition-colors"
          >
            skip
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
