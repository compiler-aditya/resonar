import Link from "next/link";
import { MicIcon } from "@/components/Icons";

export default function LandingPage() {
  return (
    <div className="py-6 space-y-8">
      <section className="space-y-4">
        <h1 className="font-sans text-[40px] sm:text-6xl font-semibold leading-[1.05] tracking-tight text-balance">
          Stories,
          <br />
          <span className="serif-italic font-normal text-plum">wrapped warm.</span>
        </h1>
        <p className="font-sans text-base text-espresso-soft leading-relaxed max-w-md">
          Share a real voice story. AI wraps it in mood-matched music and
          ambient sound. Turbopuffer semantically connects strangers who feel
          the same thing.
        </p>
        <div className="flex gap-2 pt-2">
          <Link
            href="/record"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-plum text-cream font-sans text-sm font-semibold hover:bg-plum-deep transition-colors shadow-cozy-sm"
          >
            <MicIcon className="w-4 h-4" />
            Record a story
          </Link>
          <Link
            href="/feed"
            className="inline-flex items-center px-5 py-3 rounded-full bg-cream text-espresso font-sans text-sm font-semibold hover:bg-plum-tint transition-colors"
          >
            Browse the feed
          </Link>
        </div>
      </section>

      <section className="space-y-3">
        <FeatureCard
          badge="atmosphere, live"
          title="Every story becomes a mood."
          body="ElevenLabs generates a per-story score and ambient SFX from a prompt Gemini writes specifically for your words — not a stock library."
        />
        <FeatureCard
          badge="resonance threads"
          title="Strangers who feel the same thing."
          body="Turbopuffer finds voices that resonate at the same emotional frequency and stitches them into a single continuous broadcast."
        />
        <FeatureCard
          badge="daily resonance"
          title="The world's mood, narrated."
          body="Each day, an AI narrator produces a 5-minute episode of the collective mood — real voices, original music, emotions mapped."
        />
      </section>
    </div>
  );
}

function FeatureCard({
  badge,
  title,
  body,
}: {
  badge: string;
  title: string;
  body: string;
}) {
  return (
    <article className="cozy-card p-5 space-y-2">
      <div className="text-[10px] font-bold tracking-[0.16em] uppercase text-sienna">
        {badge}
      </div>
      <h3 className="font-sans text-xl font-semibold text-espresso">{title}</h3>
      <p className="font-sans text-sm text-espresso-soft leading-relaxed">{body}</p>
    </article>
  );
}
