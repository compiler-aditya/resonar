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
      <div className="py-10 text-espresso-faint text-sm flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-sienna soft-pulse" />
        Tuning in…
      </div>
    );
  }
  if (error || !data?.story) {
    return <div className="py-10 text-rust text-sm">Could not load story.</div>;
  }

  return (
    <div className="py-3 space-y-4">
      <div className="font-sans text-[10px] font-bold tracking-[0.16em] uppercase text-sienna px-1">
        A single voice
      </div>
      <StoryCard story={data.story} />
      <div className="flex justify-end">
        <button
          onClick={share}
          className="px-4 py-2 rounded-full bg-cream text-espresso font-sans text-xs font-semibold hover:bg-plum-tint hover:text-plum transition-colors shadow-cozy-sm"
        >
          {copied ? "Link copied ✓" : "Share"}
        </button>
      </div>
    </div>
  );
}
