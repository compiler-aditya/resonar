import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="py-10 sm:py-16 space-y-14">
      <section className="space-y-6">
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-caps text-ink-faint">
          <span className="inline-block w-1.5 h-1.5 bg-signal vu-pulse" />
          <span>TRANSMISSION · MUMBAI · 24H</span>
        </div>

        <h1 className="font-sans text-5xl sm:text-7xl font-semibold tracking-tight leading-[1.02] text-balance">
          Stories that
          <br />
          <span className="text-signal">find each other.</span>
        </h1>

        <p className="max-w-2xl font-sans text-lg sm:text-xl text-ink-soft leading-relaxed text-balance">
          Share a real voice story. AI wraps it in mood-matched music and
          ambient sound. Turbopuffer semantically connects strangers who feel
          the same thing — and stitches their voices into a single continuous
          broadcast.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            href="/record"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-ink text-paper font-mono uppercase tracking-caps text-xs hover:bg-signal hover:text-paper transition-colors shadow-tape-sm"
          >
            <span className="inline-block w-2 h-2 rounded-full bg-signal" />
            RECORD A STORY
          </Link>
          <Link
            href="/feed"
            className="inline-flex items-center justify-center px-6 py-3 border border-ink text-ink font-mono uppercase tracking-caps text-xs hover:bg-ink hover:text-paper transition-colors"
          >
            [ BROWSE THE FEED ]
          </Link>
        </div>
      </section>

      <section className="border-t border-ink pt-8">
        <div className="font-mono text-[11px] uppercase tracking-caps text-ink-faint mb-4">
          SECTIONS ▸ WHAT YOU GET
        </div>

        <div className="grid sm:grid-cols-3 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-ink">
          <FeatureBlock
            id="A"
            title="Atmosphere, live"
            body="Every story becomes a mood. ElevenLabs generates a per-story score and ambient SFX from a prompt Gemini writes specifically for your words — not a stock library."
          />
          <FeatureBlock
            id="B"
            title="Resonance Threads"
            body="Turbopuffer finds strangers whose stories resonate at the same emotional frequency. Their voices stitch together into a single continuous broadcast."
          />
          <FeatureBlock
            id="C"
            title="Daily Resonance"
            body="Each day, an AI narrator produces a 5-minute episode of the world's collective mood — real voices, original music, your emotions mapped."
          />
        </div>
      </section>

      <section className="border-t border-b border-ink py-6">
        <div className="font-mono text-[11px] uppercase tracking-caps text-ink-faint flex flex-wrap gap-x-4 gap-y-1">
          <span>STACK ▸ TURBOPUFFER</span>
          <span>·</span>
          <span>ELEVENLABS MUSIC + SFX + TTS + STT</span>
          <span>·</span>
          <span>GEMINI 2.0 FLASH</span>
          <span>·</span>
          <span>768D COSINE ANN</span>
        </div>
      </section>
    </div>
  );
}

function FeatureBlock({
  id,
  title,
  body,
}: {
  id: string;
  title: string;
  body: string;
}) {
  return (
    <div className="p-5 sm:p-6 space-y-2">
      <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-caps text-ink-faint">
        <span className="inline-flex items-center justify-center w-5 h-5 border border-ink">
          {id}
        </span>
        <span>SECTION</span>
      </div>
      <h3 className="font-sans text-xl font-semibold">{title}</h3>
      <p className="font-sans text-sm text-ink-soft leading-relaxed">{body}</p>
    </div>
  );
}
