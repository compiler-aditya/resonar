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
      <div className="py-10 font-mono text-[11px] uppercase tracking-caps text-ink-faint flex items-center gap-2">
        <span className="inline-block w-1.5 h-1.5 bg-signal vu-pulse" />
        LOADING TRANSMISSIONS…
      </div>
    );
  }
  if (error || !data)
    return (
      <div className="py-10 font-mono text-[11px] uppercase tracking-caps text-signal">
        PROFILE NOT FOUND
      </div>
    );

  return (
    <div className="py-10 max-w-3xl mx-auto space-y-8">
      <header className="space-y-1">
        <div className="font-mono text-[11px] uppercase tracking-caps text-ink-faint">
          VOICE · PROFILE
        </div>
        <h1 className="font-sans text-3xl font-semibold">{data.username}</h1>
        <div className="font-mono text-[11px] uppercase tracking-caps text-ink-faint flex flex-wrap gap-x-4 gap-y-1 pt-2 font-mono-tight">
          <span>{String(data.storyCount).padStart(2, "0")} STORIES</span>
          <span>·</span>
          <span>{data.totalListens} LISTENS</span>
          <span>·</span>
          <span>{data.totalReactions} REACTIONS</span>
        </div>
      </header>

      <section className="tape-card">
        <div className="px-4 py-2 border-b border-ink bg-paper-deep font-mono text-[11px] uppercase tracking-caps text-ink-faint">
          EMOTIONAL FINGERPRINT
        </div>
        <div className="px-4 py-4">
          <EmotionalFingerprint data={data.fingerprint || []} />
        </div>
      </section>

      <section className="space-y-4">
        <div className="font-mono text-[11px] uppercase tracking-caps text-ink-faint">
          TRANSMISSIONS · {String(data.stories.length).padStart(2, "0")}
        </div>
        {data.stories.length === 0 ? (
          <div className="border border-tape bg-paper-deep px-6 py-10 text-center font-mono text-[11px] uppercase tracking-caps text-ink-faint">
            NO TRANSMISSIONS YET
          </div>
        ) : (
          <div className="space-y-5">
            {data.stories.map((s, i) => (
              <StoryCard key={s.id} story={s} trackNumber={i + 1} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
