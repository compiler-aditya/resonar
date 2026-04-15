/*
 * Minimal Music + SFX API smoke test.
 * Generates a 3s music clip and a 2s SFX and reports sizes.
 */
import { generateMusic, generateSFX } from "../lib/elevenlabs";

async function main() {
  console.log("Testing Music API (3s)…");
  const t0 = Date.now();
  const music = await generateMusic(
    "Soft piano arpeggio in C major, 70 BPM, warm and reflective",
    3000,
  );
  console.log(`✓ Music ok in ${Date.now() - t0}ms — ${music.length} bytes`);

  console.log("\nTesting SFX API (2s)…");
  const t1 = Date.now();
  const sfx = await generateSFX("gentle rain on a tin roof", 2);
  console.log(`✓ SFX ok in ${Date.now() - t1}ms — ${sfx.length} bytes`);
}

main().catch((err) => {
  console.error("✗ generation failed:");
  console.error(err);
  process.exit(1);
});
