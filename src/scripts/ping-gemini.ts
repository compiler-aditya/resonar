/*
 * Minimal Gemini connectivity check.
 * Verifies both text-embedding-004 and gemini-2.0-flash JSON mode.
 */
import { embed, analyzeStory } from "../lib/gemini";

async function main() {
  const hasKey = Boolean(process.env.GEMINI_API_KEY);
  console.log(`api key: ${hasKey ? "set" : "MISSING"}`);
  if (!hasKey) process.exit(1);

  const t0 = Date.now();
  const vec = await embed("the ache of a phone that never rings");
  console.log(`✓ embed ok in ${Date.now() - t0}ms — dim=${vec.length} head=[${vec.slice(0, 3).map((n) => n.toFixed(3)).join(", ")}…]`);

  const t1 = Date.now();
  const analysis = await analyzeStory(
    "My grandmother used to call me every Sunday at exactly four in the afternoon. Last Sunday at four, my phone rang.",
    24,
    "en",
  );
  console.log(`✓ analyzeStory ok in ${Date.now() - t1}ms`);
  console.log(`  emotion: ${analysis.emotion_primary} / ${analysis.emotion_secondary} (intensity ${analysis.intensity}, valence ${analysis.valence.toFixed(2)})`);
  console.log(`  themes: ${analysis.themes.join(", ")}`);
  console.log(`  essence: "${analysis.emotional_essence.slice(0, 90)}…"`);
  console.log(`  music: "${analysis.music_prompt.slice(0, 90)}…"`);
  console.log(`  sfx: "${analysis.sfx_prompt.slice(0, 90)}…"`);
  console.log(`  volumes: music=${analysis.music_volume} sfx=${analysis.sfx_volume}`);
}

main().catch((err) => {
  console.error("✗ gemini call failed:");
  console.error(err);
  process.exit(1);
});
