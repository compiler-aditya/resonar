/*
 * Quick dev tool to inspect what's in turbopuffer.
 * Run: `npm run debug-query`
 */
import { newStories } from "../lib/turbopuffer";

async function main() {
  const stories = await newStories(20);
  console.log(`Found ${stories.length} stories:`);
  for (const s of stories) {
    console.log(
      `- ${s.id} | ${s.emotion_primary} (${s.emotion_intensity}) | ${s.username} | ${s.created_at}`,
    );
    console.log(`    essence: ${s.emotional_essence.slice(0, 120)}`);
    console.log(`    raw: ${s.audio_raw_url || "(none)"}`);
    console.log(`    atmos: ${s.audio_atmosphere_url || "(none — brewing)"}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
