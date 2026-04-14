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

  if (isLoading) return <div className="py-10 text-white/50">Loading…</div>;
  if (error || !data)
    return <div className="py-10 text-red-300">Profile not found.</div>;

  return (
    <div className="py-10 max-w-3xl mx-auto space-y-8">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-widest text-white/40">Profile</p>
        <h1 className="text-3xl font-semibold">{data.username}</h1>
        <div className="flex gap-4 text-sm text-white/60">
          <span>{data.storyCount} stories</span>
          <span>·</span>
          <span>{data.totalListens} listens</span>
          <span>·</span>
          <span>{data.totalReactions} reactions</span>
        </div>
      </header>

      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 space-y-2">
        <h2 className="text-sm uppercase tracking-widest text-white/40">
          Emotional Fingerprint
        </h2>
        <EmotionalFingerprint data={data.fingerprint || []} />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm uppercase tracking-widest text-white/40">Stories</h2>
        {data.stories.length === 0 ? (
          <div className="text-white/50 text-sm py-6 text-center">
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
