/*
 * Top up the 2 demo stories that hit Gemini 503 on the first seed pass.
 */
import { randomUUID } from "node:crypto";
import { synthesizeSpeech } from "../lib/elevenlabs";
import { uploadAudio } from "../lib/storage";
import { processStoryJob } from "../workers/processStory";

interface DemoStory {
  username: string;
  country: string;
  transcript: string;
  durationSeconds: number;
}

const MISSING: DemoStory[] = [
  {
    username: "Moonlit-Heron-1293",
    country: "NG",
    transcript:
      "I moved to Lagos when I was nineteen with one bag and a promise to send money home. The first night in my new room I cried because the ceiling fan sounded nothing like the one in my mother's kitchen. Five years in, it still doesn't. But now I call it home.",
    durationSeconds: 30,
  },
  {
    username: "Amber-Fox-5561",
    country: "US",
    transcript:
      "I keep looking at my phone waiting for someone to text me first. It's a small thing. Everyone says it's a small thing. But at midnight, when nobody has, it doesn't feel small.",
    durationSeconds: 20,
  },
];

async function seedOne(story: DemoStory): Promise<void> {
  console.log(`\n→ Seeding: ${story.username}`);
  const voice = await synthesizeSpeech(story.transcript);
  console.log(`  synthesized voice (${voice.length} bytes)`);

  const jobId = randomUUID();
  const key = `stories/pending/${jobId}.mp3`;
  const rawUrl = await uploadAudio(key, voice, "audio/mpeg");
  console.log(`  uploaded raw: ${rawUrl}`);

  const storyId = await processStoryJob({
    storyJobId: jobId,
    guestId: `seed-${story.username}`,
    username: story.username,
    rawAudioKey: key,
    rawAudioUrl: rawUrl,
    durationSeconds: story.durationSeconds,
  });
  console.log(`  ✓ story ${storyId} processed`);
}

async function main() {
  for (const story of MISSING) {
    try {
      await seedOne(story);
    } catch (err) {
      console.error(`  ✗ failed: ${(err as Error).message}`);
    }
  }
  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
