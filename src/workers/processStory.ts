import { randomUUID } from "node:crypto";
import { transcribeAudio, generateMusic, generateSFX } from "../lib/elevenlabs";
import { analyzeStory, embed } from "../lib/gemini";
import { mixStoryAtmosphere } from "../lib/audiomix";
import { uploadAudio, storyAtmosphereKey } from "../lib/storage";
import { insertStory, patchStory } from "../lib/turbopuffer";
import type { StoryRow } from "../lib/turbopuffer";
import type { ProcessStoryJobData } from "../lib/jobs";

export async function processStoryJob(data: ProcessStoryJobData): Promise<string> {
  const { guestId, username, rawAudioUrl, durationSeconds, promptId } = data;
  const storyId = randomUUID();
  console.log(`[processStory ${storyId}] starting`);

  const audio = await fetchBuffer(rawAudioUrl);

  const transcription = await transcribeAudio(audio, "audio/webm");
  const transcript = transcription.text || "";
  const actualDuration = transcription.durationSeconds || durationSeconds || 30;

  const analysis = await analyzeStory(transcript, actualDuration);
  const vector = await embed(analysis.emotional_essence || transcript.slice(0, 400));

  const now = new Date().toISOString();
  const row: StoryRow = {
    id: storyId,
    vector,
    transcript,
    emotional_essence: analysis.emotional_essence,
    audio_raw_url: rawAudioUrl,
    audio_atmosphere_url: null,
    duration_seconds: Math.round(actualDuration),
    emotion_primary: analysis.emotion_primary,
    emotion_secondary: analysis.emotion_secondary,
    emotion_intensity: analysis.intensity,
    mood_valence: analysis.valence,
    themes: analysis.themes,
    guest_id: guestId,
    username,
    country: "IN",
    language: transcription.languageCode || "en",
    react_felt_this: 0,
    react_laughed: 0,
    react_chills: 0,
    react_me_too: 0,
    react_hugged: 0,
    total_listens: 0,
    total_reactions: 0,
    created_at: now,
    prompt_id: promptId || "",
    is_public: true,
    thread_ids: [],
  };

  await insertStory(row);
  console.log(`[processStory ${storyId}] raw published`);

  try {
    const [music, sfx] = await Promise.all([
      generateMusic(analysis.music_prompt, Math.min(actualDuration * 1000, 180000)),
      generateSFX(analysis.sfx_prompt, Math.min(actualDuration, 30), { loop: true }),
    ]);
    const mixed = await mixStoryAtmosphere({
      voice: audio,
      music,
      sfx,
      musicVolume: analysis.music_volume,
      sfxVolume: analysis.sfx_volume,
      durationSeconds: actualDuration,
    });
    const atmosphereUrl = await uploadAudio(storyAtmosphereKey(storyId), mixed);
    await patchStory(storyId, { audio_atmosphere_url: atmosphereUrl });
    console.log(`[processStory ${storyId}] atmosphere attached`);
  } catch (err) {
    console.error(`[processStory ${storyId}] atmosphere failed`, err);
  }

  return storyId;
}

async function fetchBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetchBuffer(${url}) → ${res.status}`);
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}
