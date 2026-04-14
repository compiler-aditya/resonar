import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="py-12 sm:py-20 space-y-16">
      <section className="text-center space-y-5 max-w-3xl mx-auto">
        <p className="text-xs sm:text-sm uppercase tracking-[0.3em] text-white/50">
          Resonar
        </p>
        <h1 className="text-4xl sm:text-7xl font-semibold tracking-tight text-balance">
          Stories that find{" "}
          <span className="bg-gradient-to-r from-fuchsia-400 via-sky-400 to-emerald-300 bg-clip-text text-transparent">
            each other.
          </span>
        </h1>
        <p className="text-white/70 text-lg sm:text-xl text-balance leading-relaxed">
          Share a real voice story. AI wraps it in mood-matched music and
          ambient sound. Turbopuffer semantically connects strangers who feel
          the same thing.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Link
            href="/record"
            className="px-6 py-3 bg-white text-black rounded-full font-medium hover:bg-white/90 transition"
          >
            Record a story →
          </Link>
          <Link
            href="/feed"
            className="px-6 py-3 bg-white/10 rounded-full font-medium hover:bg-white/20 transition"
          >
            Browse the feed
          </Link>
        </div>
      </section>

      <section className="grid sm:grid-cols-3 gap-4">
        <FeatureCard
          title="Atmosphere, live"
          color="from-fuchsia-500/20"
          body="Every story becomes a mood. ElevenLabs generates a per-story score and ambient SFX from a prompt Gemini writes specifically for your words."
        />
        <FeatureCard
          title="Resonance Threads"
          color="from-sky-500/20"
          body="Turbopuffer finds strangers whose stories resonate at the same emotional frequency. Their voices stitch together into a single continuous thread."
        />
        <FeatureCard
          title="Daily Resonance"
          color="from-emerald-500/20"
          body="Each day, an AI narrator produces a 5-minute episode of the world's collective mood — real voices, original music, your emotions mapped."
        />
      </section>

      <section className="max-w-3xl mx-auto space-y-4 text-center">
        <p className="text-xs uppercase tracking-widest text-white/40">
          Built for ElevenHacks
        </p>
        <p className="text-white/60">
          Powered by{" "}
          <a
            href="https://turbopuffer.com"
            className="underline hover:text-white"
            target="_blank"
            rel="noreferrer"
          >
            turbopuffer
          </a>{" "}
          and{" "}
          <a
            href="https://elevenlabs.io"
            className="underline hover:text-white"
            target="_blank"
            rel="noreferrer"
          >
            ElevenLabs
          </a>
          . Vector search meets generative audio.
        </p>
      </section>
    </div>
  );
}

function FeatureCard({
  title,
  body,
  color,
}: {
  title: string;
  body: string;
  color: string;
}) {
  return (
    <div
      className={`relative rounded-3xl border border-white/10 p-6 overflow-hidden bg-gradient-to-br ${color} to-transparent`}
    >
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="text-sm text-white/70 mt-2 leading-relaxed">{body}</p>
    </div>
  );
}
