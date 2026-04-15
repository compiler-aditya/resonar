/*
 * Retry atmosphere generation for any story that already has raw audio
 * but no audio_atmosphere_url. Use after fixing ffmpeg or retrying
 * Gemini 503 failures.
 */
import { newStories, patchStory, getStory } from "../lib/turbopuffer";
import { analyzeStory } from "../lib/gemini";
import { generateMusic, generateSFX, transcribeAudio } from "../lib/elevenlabs";
import { mixStoryAtmosphere } from "../lib/audiomix";
import { uploadAudio, storyAtmosphereKey } from "../lib/storage";
import { buildThreadForStory } from "../workers/buildThread";

async function main() {
  const stories = await newStories(100);
  const needsFix = stories.filter(
    (s) => !s.id.startsWith("__warmup") && !s.audio_atmosphere_url,
  );

  console.log(`Found ${needsFix.length} stories needing atmosphere:`);
  for (const s of needsFix) {
    console.log(`  ${s.id} · ${s.username} · ${s.emotion_primary}`);
  }

  for (const s of needsFix) {
    console.log(`\n→ Fixing ${s.id} (${s.username})`);
    try {
      const fresh = await getStory(s.id);
      if (!fresh?.audio_raw_url) {
        console.log(`  ! no raw audio, skipping`);
        continue;
      }

      const audio = Buffer.from(await (await fetch(fresh.audio_raw_url)).arrayBuffer());

      // We need the music_prompt and sfx_prompt — re-derive them from the
      // stored transcript + essence via gemini.analyzeStory.
      let musicPrompt: string;
      let sfxPrompt: string;
      let musicVolume = 0.15;
      let sfxVolume = 0.08;
      if (fresh.transcript) {
        const analysis = await analyzeStory(
          fresh.transcript,
          fresh.duration_seconds || 30,
          fresh.language || "en",
        );
        musicPrompt = analysis.music_prompt;
        sfxPrompt = analysis.sfx_prompt;
        musicVolume = analysis.music_volume;
        sfxVolume = analysis.sfx_volume;
      } else {
        // Re-transcribe if transcript isn't stored
        const tx = await transcribeAudio(audio, "audio/mpeg");
        const analysis = await analyzeStory(
          tx.text,
          tx.durationSeconds || fresh.duration_seconds || 30,
          tx.languageCode || "en",
        );
        musicPrompt = analysis.music_prompt;
        sfxPrompt = analysis.sfx_prompt;
        musicVolume = analysis.music_volume;
        sfxVolume = analysis.sfx_volume;
      }

      const dur = Math.max(5, fresh.duration_seconds || 30);
      const [music, sfx] = await Promise.all([
        generateMusic(musicPrompt, Math.min(dur * 1000, 180000)),
        generateSFX(sfxPrompt, Math.min(dur, 30)),
      ]);
      console.log(`  music=${music.length}B sfx=${sfx.length}B`);

      const mixed = await mixStoryAtmosphere({
        voice: audio,
        music,
        sfx,
        musicVolume,
        sfxVolume,
        durationSeconds: dur,
      });
      console.log(`  mixed=${mixed.length}B`);

      const url = await uploadAudio(storyAtmosphereKey(s.id), mixed);
      await patchStory(s.id, { audio_atmosphere_url: url });
      console.log(`  ✓ atmosphere attached`);

      buildThreadForStory(s.id).catch((err) =>
        console.warn(`  buildThread failed`, err),
      );
    } catch (err) {
      console.error(`  ✗ fix failed:`, (err as Error).message);
    }
  }

  console.log(`\nDone.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
