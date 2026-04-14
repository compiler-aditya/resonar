/*
 * Seed Resonar with a set of demo stories for the hackathon video.
 *
 * This script DOES NOT require the recorder / mic. It synthesizes each
 * demo story's voice via ElevenLabs TTS, then pushes the whole thing
 * through the same pipeline real users would hit: STT → Gemini analyze
 * → embedding → turbopuffer insert → Music/SFX → FFmpeg mix → patch.
 *
 * Run: `npm run seed-stories`
 */
import { randomUUID } from "node:crypto";
import { synthesizeSpeech } from "../lib/elevenlabs";
import { uploadAudio } from "../lib/storage";
import { processStoryJob } from "../workers/processStory";

interface DemoStory {
  username: string;
  country: string;
  voiceId?: string;
  transcript: string;
  durationSeconds: number;
}

const DEMO_STORIES: DemoStory[] = [
  {
    username: "Velvet-Sparrow-4782",
    country: "IN",
    transcript:
      "My grandmother used to call me every Sunday at exactly four in the afternoon. I would hear her little voice asking if I had eaten, always eaten, always eaten. She passed two winters ago. Last Sunday at four, my phone rang. I know it wasn't her. But for a second, I hoped.",
    durationSeconds: 28,
  },
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
  {
    username: "Saffron-Otter-7834",
    country: "MX",
    transcript:
      "The first time I laughed after my dad died was at a taco stand in Oaxaca. The man behind the counter said something so dumb, so unexpectedly dumb, that I laughed like I hadn't in months. I tipped him everything in my wallet. He didn't understand why.",
    durationSeconds: 26,
  },
  {
    username: "Midnight-Raven-2019",
    country: "BR",
    transcript:
      "I quit my safe job on a Wednesday. I hadn't told anyone. I walked out of the building and stood on the sidewalk and just — breathed. Nobody knew yet. For those twenty seconds the whole world was mine and nothing else was real.",
    durationSeconds: 25,
  },
  {
    username: "Honeyed-Swift-4411",
    country: "JP",
    transcript:
      "There's a vending machine near my apartment that plays a little jingle every time you buy a coffee. I bought one yesterday at two in the morning after a bad call with my ex. The jingle played. I laughed. Then I cried. Then I bought another one just to hear it again.",
    durationSeconds: 32,
  },
];

async function seedOne(story: DemoStory): Promise<void> {
  console.log(`\n→ Seeding: ${story.username}`);
  const voice = await synthesizeSpeech(story.transcript, { voiceId: story.voiceId });
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
  for (const story of DEMO_STORIES) {
    try {
      await seedOne(story);
    } catch (err) {
      console.error(`  ✗ failed: ${(err as Error).message}`);
    }
  }
  console.log("\nAll demo stories seeded.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
