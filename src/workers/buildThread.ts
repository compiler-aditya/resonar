import { randomUUID } from "node:crypto";
import {
  getStory,
  findSimilarStoriesForThread,
  upsertThread,
  attachStoryToThread,
  type StoryRow,
  type ThreadRow,
} from "../lib/turbopuffer";
import { generateThreadBridge, generateThreadTitle, embed } from "../lib/gemini";
import { generateMusic, generateSFX } from "../lib/elevenlabs";
import { assembleThread } from "../lib/audiomix";
import { uploadAudio, threadAudioKey } from "../lib/storage";

const MIN_STORIES = 3;
const MAX_STORIES = 4;

export async function buildThreadForStory(storyId: string): Promise<string | null> {
  const seed = await getStory(storyId);
  if (!seed || !seed.audio_atmosphere_url) {
    console.log(`[buildThread] skipping ${storyId}: no atmosphere yet`);
    return null;
  }

  const candidates = await findSimilarStoriesForThread(
    seed.vector,
    seed.id,
    seed.guest_id,
    8,
  );
  const withAtmosphere = candidates.filter((c) => Boolean(c.audio_atmosphere_url));
  if (withAtmosphere.length < MIN_STORIES - 1) {
    console.log(
      `[buildThread ${storyId}] only ${withAtmosphere.length} atmosphere-ready candidates, need ${MIN_STORIES - 1}`,
    );
    return null;
  }

  const picks = pickDiverse(withAtmosphere, MAX_STORIES - 1);
  const orderedStories: StoryRow[] = [seed, ...picks];

  const essences = orderedStories.map((s) => s.emotional_essence);
  const titleInfo = await generateThreadTitle(essences);
  const sharedTheme = titleInfo.shared_theme || "These voices resonate.";

  const bridgeMusics: Buffer[] = [];
  for (let i = 0; i < orderedStories.length - 1; i++) {
    const a = orderedStories[i];
    const b = orderedStories[i + 1];
    try {
      const bridge = await generateThreadBridge(
        a.emotional_essence,
        b.emotional_essence,
        sharedTheme,
      );
      const music = await generateMusic(bridge.bridge_music_prompt, 8000);
      bridgeMusics.push(music);
    } catch (err) {
      console.warn(`[buildThread ${storyId}] bridge ${i} failed, using SFX fallback`, err);
      const sfx = await generateSFX(
        "A gentle 3-second ambient texture shift transition",
        3,
      ).catch(() => Buffer.alloc(0));
      bridgeMusics.push(sfx);
    }
  }

  const storyAudios: Buffer[] = [];
  for (const s of orderedStories) {
    const url = s.audio_atmosphere_url || s.audio_raw_url;
    if (!url) continue;
    const buf = await fetchBuffer(url);
    storyAudios.push(buf);
  }
  if (storyAudios.length !== orderedStories.length) {
    console.warn(`[buildThread ${storyId}] some audio downloads failed`);
    return null;
  }

  const threadAudio = await assembleThread({
    stories: storyAudios,
    bridges: bridgeMusics,
  });

  const threadId = randomUUID();
  const url = await uploadAudio(threadAudioKey(threadId), threadAudio);

  const centroid = averageVectors(orderedStories.map((s) => s.vector));
  const vector = centroid.length === 768 ? centroid : await embed(sharedTheme);

  const countries = Array.from(
    new Set(orderedStories.map((s) => s.country).filter(Boolean)),
  );
  const storyIds = orderedStories.map((s) => s.id);

  const totalDuration = orderedStories.reduce((n, s) => n + s.duration_seconds, 0);
  const now = new Date().toISOString();
  const row: ThreadRow = {
    id: threadId,
    vector,
    title: titleInfo.title || "Resonance",
    shared_theme: sharedTheme,
    story_ids: storyIds,
    story_count: orderedStories.length,
    countries,
    thread_audio_url: url,
    thread_duration_seconds: totalDuration + bridgeMusics.length * 8,
    total_listens: 0,
    total_reactions: 0,
    created_at: now,
    is_featured: false,
  };
  await upsertThread(row);

  for (const s of orderedStories) {
    await attachStoryToThread(s.id, threadId);
  }

  console.log(`[buildThread ${storyId}] thread ${threadId} created: "${row.title}"`);
  return threadId;
}

function pickDiverse(candidates: StoryRow[], n: number): StoryRow[] {
  const seenCountries = new Set<string>();
  const seenGuests = new Set<string>();
  const picks: StoryRow[] = [];
  for (const c of candidates) {
    if (picks.length >= n) break;
    if (seenGuests.has(c.guest_id)) continue;
    if (seenCountries.has(c.country) && picks.length < n) {
      // allow repeated country only if we have nothing else
    }
    seenGuests.add(c.guest_id);
    seenCountries.add(c.country);
    picks.push(c);
  }
  return picks;
}

function averageVectors(vectors: number[][]): number[] {
  if (vectors.length === 0) return [];
  const dim = vectors[0].length;
  const sum = new Array<number>(dim).fill(0);
  for (const v of vectors) {
    if (v.length !== dim) continue;
    for (let i = 0; i < dim; i++) sum[i] += v[i];
  }
  const avg = sum.map((x) => x / vectors.length);
  let norm = 0;
  for (const x of avg) norm += x * x;
  const n = Math.sqrt(norm) || 1;
  return avg.map((x) => x / n);
}

async function fetchBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetchBuffer(${url}) → ${res.status}`);
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}
