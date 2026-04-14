"use client";

import { useState } from "react";
import useSWR from "swr";
import StoryCard, { type StoryCardData } from "@/components/StoryCard";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function StoryPage({ params }: { params: { id: string } }) {
  const { data, error, isLoading } = useSWR<{ story: StoryCardData }>(
    `/api/stories/${params.id}`,
    fetcher,
    { refreshInterval: 5000 },
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
        await nav.share({ url, title: "A voice story on Resonar" });
      } else {
        await nav.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }
    } catch {
      // user cancelled share sheet
    }
  };

  if (isLoading) {
    return (
      <div className="py-10 font-mono text-[11px] uppercase tracking-caps text-ink-faint flex items-center gap-2">
        <span className="inline-block w-1.5 h-1.5 bg-signal vu-pulse" />
        TUNING IN…
      </div>
    );
  }
  if (error || !data?.story) {
    return (
      <div className="py-10 font-mono text-[11px] uppercase tracking-caps text-signal">
        SIGNAL LOST — COULD NOT LOAD STORY
      </div>
    );
  }

  return (
    <div className="py-10 max-w-2xl mx-auto space-y-5">
      <div className="font-mono text-[11px] uppercase tracking-caps text-ink-faint">
        SINGLE TRANSMISSION
      </div>
      <StoryCard story={data.story} />
      <div className="flex justify-end">
        <button
          onClick={share}
          className="inline-flex items-center gap-2 px-4 py-2 border border-ink font-mono text-[11px] uppercase tracking-caps text-ink hover:bg-ink hover:text-paper transition-colors"
        >
          {copied ? "◉ LINK COPIED" : "[ SHARE ]"}
        </button>
      </div>
    </div>
  );
}
