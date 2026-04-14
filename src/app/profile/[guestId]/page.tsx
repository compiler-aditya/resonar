"use client";

import useSWR from "swr";
import StoryCard, { type StoryCardData } from "@/components/StoryCard";
import EmotionalFingerprint, {
  type FingerprintPoint,
} from "@/components/EmotionalFingerprint";

interface ProfileData {
  guestId: string;
  username: string;
  storyCount: number;
  totalListens: number;
  totalReactions: number;
  fingerprint: FingerprintPoint[];
  stories: StoryCardData[];
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ProfilePage({ params }: { params: { guestId: string } }) {
  const { data, isLoading, error } = useSWR<ProfileData>(
    `/api/profile/${params.guestId}`,
    fetcher,
  );

  if (isLoading) {
    return (
      <div className="py-10 text-espresso-faint text-sm flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-sienna soft-pulse" />
        Loading…
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="py-10 text-rust text-sm">Profile not found.</div>
    );
  }

  return (
    <div className="py-3 space-y-6">
      <header className="cozy-card p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-plum text-cream flex items-center justify-center text-xl font-semibold shrink-0 shadow-cozy-sm">
          {data.username.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="font-sans text-xl font-semibold text-espresso truncate">
            {data.username}
          </h1>
          <div className="font-sans text-xs text-espresso-faint mt-1 flex gap-3">
            <span><b className="font-semibold text-espresso">{data.storyCount}</b> stories</span>
            <span><b className="font-semibold text-espresso">{data.totalListens}</b> listens</span>
            <span><b className="font-semibold text-espresso">{data.totalReactions}</b> reactions</span>
          </div>
        </div>
      </header>

      <section className="cozy-card p-5 space-y-3">
        <div className="font-sans text-[10px] font-bold tracking-[0.16em] uppercase text-sienna">
          Emotional Fingerprint
        </div>
        <EmotionalFingerprint data={data.fingerprint || []} />
      </section>

      <section className="space-y-3">
        <div className="font-sans text-[10px] font-bold tracking-[0.16em] uppercase text-sienna px-1">
          Their stories
        </div>
        {data.stories.length === 0 ? (
          <div className="cozy-card p-8 text-center text-espresso-faint text-sm">
            No stories shared yet.
          </div>
        ) : (
          <div className="space-y-4">
            {data.stories.map((s) => (
              <StoryCard key={s.id} story={s} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
