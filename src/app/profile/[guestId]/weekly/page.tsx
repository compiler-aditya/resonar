"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";

interface WeeklyData {
  guestId: string;
  username: string;
  storyCount: number;
  totalListens: number;
  totalReactions: number;
  dominantEmotion: string | null;
  secondaryEmotion: string | null;
  worldDominant: string | null;
  fingerprint: Array<{ emotion_primary: string; count: number }>;
  themes: Array<{ name: string; count: number }>;
  stories: Array<{
    id: string;
    emotional_essence: string;
    emotion_primary: string;
    created_at: string;
  }>;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function WeeklyPage({ params }: { params: { guestId: string } }) {
  const { data, isLoading } = useSWR<WeeklyData>(
    `/api/profile/${params.guestId}/weekly`,
    fetcher,
  );
  const [copied, setCopied] = useState(false);

  const share = async () => {
    if (typeof window === "undefined") return;
    const url = window.location.href;
    try {
      const nav = window.navigator as Navigator & {
        share?: (d: { url: string; title: string }) => Promise<void>;
      };
      if (typeof nav.share === "function") {
        await nav.share({ url, title: "My week on Resonar" });
      } else {
        await nav.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }
    } catch {
      // cancelled
    }
  };

  if (isLoading) {
    return (
      <div className="py-10 text-espresso-faint text-sm flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-sienna soft-pulse" />
        Reading your week…
      </div>
    );
  }
  if (!data) return <div className="py-10 text-rust text-sm">Not found.</div>;

  const empty = data.storyCount === 0;

  return (
    <div className="py-3 space-y-5">
      <header className="space-y-2">
        <div className="font-sans text-[10px] font-bold tracking-[0.16em] uppercase text-sienna">
          Weekly Resonance · {data.username}
        </div>
        <h1 className="font-sans text-3xl font-semibold text-espresso">
          This week you sounded like{" "}
          <span className="serif-italic font-normal text-plum">
            {data.dominantEmotion ?? "no one yet"}.
          </span>
        </h1>
      </header>

      {empty ? (
        <div className="cozy-card p-8 text-center space-y-3">
          <p className="font-sans text-sm text-espresso-soft">
            You haven&apos;t shared any stories this week yet.
          </p>
          <Link
            href="/record"
            className="inline-block font-sans text-sm font-semibold text-plum hover:text-plum-deep"
          >
            Record your first →
          </Link>
        </div>
      ) : (
        <>
          <section className="cozy-card p-5 space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <Stat label="Stories" value={String(data.storyCount)} />
              <Stat label="Listens" value={String(data.totalListens)} />
              <Stat label="Reactions" value={String(data.totalReactions)} />
            </div>
            {data.fingerprint.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-espresso/10">
                <div className="font-sans text-[10px] font-bold tracking-[0.16em] uppercase text-sienna">
                  Your emotional mix
                </div>
                <div className="flex rounded-full overflow-hidden h-2.5 bg-sand-soft">
                  {data.fingerprint.map((f) => {
                    const total = data.fingerprint.reduce((n, x) => n + x.count, 0) || 1;
                    return (
                      <div
                        key={f.emotion_primary}
                        style={{
                          width: `${(f.count / total) * 100}%`,
                          background: emotionColor(f.emotion_primary),
                        }}
                        title={`${f.emotion_primary} · ${f.count}`}
                      />
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {data.fingerprint.map((f) => (
                    <span
                      key={f.emotion_primary}
                      className="inline-flex items-center gap-1.5 font-sans text-[10px] uppercase tracking-[0.12em] text-espresso-soft"
                    >
                      <span
                        className="inline-block w-1.5 h-1.5 rounded-full"
                        style={{ background: emotionColor(f.emotion_primary) }}
                      />
                      {f.emotion_primary} · {f.count}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>

          {data.themes.length > 0 && (
            <section className="cozy-card p-5 space-y-3">
              <div className="font-sans text-[10px] font-bold tracking-[0.16em] uppercase text-sienna">
                You kept returning to
              </div>
              <div className="flex flex-wrap gap-2">
                {data.themes.map((t) => (
                  <span
                    key={t.name}
                    className="px-3 py-1 rounded-full bg-plum-tint text-plum font-sans text-xs font-medium"
                  >
                    {t.name}
                  </span>
                ))}
              </div>
            </section>
          )}

          {data.worldDominant && (
            <section className="cozy-card-tint p-5 space-y-2 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-24 h-24 rounded-full bg-plum-mist opacity-60 -translate-y-8 translate-x-8" />
              <div className="font-sans text-[10px] font-bold tracking-[0.16em] uppercase text-sienna relative">
                The world this week
              </div>
              <p className="serif-italic text-espresso text-[17px] leading-snug relative">
                The world was mostly feeling{" "}
                <span className="text-plum not-italic font-semibold">
                  {data.worldDominant}
                </span>
                .
              </p>
            </section>
          )}

          {data.stories.length > 0 && (
            <section className="space-y-3">
              <div className="font-sans text-[10px] font-bold tracking-[0.16em] uppercase text-sienna px-1">
                Your stories this week
              </div>
              <div className="space-y-2">
                {data.stories.map((s) => (
                  <Link
                    key={s.id}
                    href={`/story/${s.id}`}
                    className="cozy-card block px-4 py-3 hover:bg-cream-soft transition-colors"
                  >
                    <div className="font-sans text-[10px] uppercase tracking-[0.1em] text-espresso-faint">
                      {s.emotion_primary}
                    </div>
                    <p className="serif-italic text-espresso text-[14px] leading-snug line-clamp-2 mt-1">
                      &ldquo;{s.emotional_essence}&rdquo;
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <div className="flex justify-end pt-2">
            <button
              onClick={share}
              className="px-4 py-2 rounded-full bg-plum text-cream font-sans text-xs font-semibold hover:bg-plum-deep transition-colors shadow-cozy-sm"
            >
              {copied ? "Link copied ✓" : "Share my week ↗"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-sans text-2xl font-semibold text-espresso tabular-nums">
        {value}
      </div>
      <div className="font-sans text-[10px] uppercase tracking-[0.12em] text-espresso-faint mt-0.5">
        {label}
      </div>
    </div>
  );
}

function emotionColor(emotion: string): string {
  const map: Record<string, string> = {
    joy: "#c4803a",
    nostalgia: "#b04b5e",
    tenderness: "#d28aa0",
    longing: "#8a6478",
    loneliness: "#4f5b70",
    grief: "#8b3a2c",
    anger: "#a03828",
    gratitude: "#6a7548",
    hope: "#7fa07a",
    defiance: "#b65a2e",
    anxiety: "#c48a4a",
    excitement: "#d9571e",
    love: "#c15670",
    tender: "#d28aa0",
  };
  return map[emotion.toLowerCase()] || "#6b4a5c";
}
