/*
 * One-time: pre-generate the 5 reaction SFX mp3s via ElevenLabs
 * and save them under public/reactions/*.mp3.
 *
 * Run: `npm run seed-reactions`
 */
import { generateSFX } from "../lib/elevenlabs";
import { promises as fs } from "node:fs";
import path from "node:path";

const REACTIONS: Array<{ key: string; prompt: string; seconds: number }> = [
  {
    key: "felt_this",
    prompt:
      "A single warm low piano chord with a soft heartbeat-like pulse, intimate and resonant, 2 seconds",
    seconds: 2,
  },
  {
    key: "laughed",
    prompt:
      "A bright playful marimba ascending arpeggio like a laugh crystallized into music, 1.5 seconds",
    seconds: 2,
  },
  {
    key: "chills",
    prompt:
      "A shimmering high frequency crystalline wash like ice forming, ethereal bells, short, 2 seconds",
    seconds: 2,
  },
  {
    key: "me_too",
    prompt:
      "Two soft warm tones meeting in harmony like hands clasping, brief and tender, 2 seconds",
    seconds: 2,
  },
  {
    key: "hugged",
    prompt:
      "A deep warm enveloping pad tone like being wrapped in a blanket, round low harmonic, 2 seconds",
    seconds: 2,
  },
];

async function main() {
  const outDir = path.resolve("public/reactions");
  await fs.mkdir(outDir, { recursive: true });

  for (const r of REACTIONS) {
    const file = path.join(outDir, `${r.key}.mp3`);
    try {
      await fs.access(file);
      console.log(`${r.key}.mp3 already exists, skipping`);
      continue;
    } catch {
      // fallthrough
    }
    console.log(`Generating ${r.key}.mp3 …`);
    const audio = await generateSFX(r.prompt, r.seconds, { loop: false });
    await fs.writeFile(file, audio);
    console.log(`  wrote ${file} (${audio.length} bytes)`);
  }

  console.log("Done. All reaction SFX generated.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
