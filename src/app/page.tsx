import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="py-12 space-y-10">
      <section className="text-center space-y-4">
        <p className="text-sm uppercase tracking-widest text-white/50">Resonar</p>
        <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight text-balance">
          Stories that find each other.
        </h1>
        <p className="max-w-2xl mx-auto text-white/70 text-lg text-balance">
          Share a real voice story. AI wraps it in mood-matched atmosphere.
          Turbopuffer semantically connects strangers who feel the same thing.
        </p>
        <div className="flex gap-3 justify-center pt-4">
          <Link
            href="/record"
            className="px-5 py-3 bg-white text-black rounded-full font-medium hover:bg-white/90 transition"
          >
            Record a story
          </Link>
          <Link
            href="/feed"
            className="px-5 py-3 bg-white/10 rounded-full font-medium hover:bg-white/20 transition"
          >
            Browse the feed
          </Link>
        </div>
      </section>

      <section className="grid sm:grid-cols-3 gap-4 pt-8">
        <div className="rounded-2xl border border-white/10 p-5">
          <h3 className="font-semibold">Atmosphere, live</h3>
          <p className="text-sm text-white/60 mt-2">
            Every story becomes a mood — ElevenLabs generates a per-story score and ambient SFX that matches the emotional core of your voice.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 p-5">
          <h3 className="font-semibold">Resonance Threads</h3>
          <p className="text-sm text-white/60 mt-2">
            Turbopuffer finds strangers whose stories vibrate at the same frequency. Their voices become a single continuous thread.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 p-5">
          <h3 className="font-semibold">Daily Resonance</h3>
          <p className="text-sm text-white/60 mt-2">
            Each day, an AI narrator crafts a 5-minute episode of the world&apos;s collective mood — narration, music, and real voices.
          </p>
        </div>
      </section>
    </div>
  );
}
