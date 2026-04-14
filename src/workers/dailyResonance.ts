import {
  aggregateEmotions,
  topStoryByEmotion,
  upsertThread,
  getThread,
  type StoryRow,
  type ThreadRow,
} from "../lib/turbopuffer";
import { generateDailyEcho, embed } from "../lib/gemini";
import { synthesizeSpeech, generateMusic, NARRATOR_VOICE_ID } from "../lib/elevenlabs";
import { assembleDailyEcho } from "../lib/audiomix";
import { uploadAudio, dailyEchoKey } from "../lib/storage";

const LOOKBACK_HOURS = 24;

export function dailyEchoId(date: string): string {
  return `daily-${date}`;
}

export function todayStr(now = new Date()): string {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export interface DailyResonanceResult {
  id: string;
  date: string;
  audioUrl: string;
  title: string;
  storyCount: number;
}

export async function generateDailyResonance(
  opts: { date?: string; force?: boolean } = {},
): Promise<DailyResonanceResult | null> {
  const date = opts.date || todayStr();
  const id = dailyEchoId(date);

  if (!opts.force) {
    const existing = await getThread(id).catch(() => null);
    if (existing?.thread_audio_url) {
      console.log(`[dailyResonance ${date}] already exists, skipping`);
      return {
        id,
        date,
        audioUrl: existing.thread_audio_url,
        title: existing.title,
        storyCount: existing.story_count,
      };
    }
  }

  console.log(`[dailyResonance ${date}] generating`);
  const since = new Date(Date.now() - LOOKBACK_HOURS * 3600 * 1000).toISOString();
  const moods = await aggregateEmotions({ sinceIso: since });
  const cleanMoods = moods
    .filter((m) => m.emotion_primary && m.emotion_primary !== "warmup")
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  if (cleanMoods.length === 0) {
    console.warn(`[dailyResonance ${date}] no moods in last 24h, aborting`);
    return null;
  }

  const clusters: Array<{ emotion: string; count: number; story: StoryRow }> = [];
  for (const m of cleanMoods) {
    const story = await topStoryByEmotion(m.emotion_primary, since);
    if (story) clusters.push({ emotion: m.emotion_primary, count: m.count, story });
  }
  if (clusters.length === 0) {
    console.warn(`[dailyResonance ${date}] no stories for top moods`);
    return null;
  }

  const echo = await generateDailyEcho({
    date,
    clusters: clusters.map((c) => ({
      emotion: c.emotion,
      count: c.count,
      story_essence: c.story.emotional_essence,
      username: c.story.username,
      country: c.story.country || "the world",
    })),
  });

  const voiceId = NARRATOR_VOICE_ID;
  const [narrationIntro, narrationClosing] = await Promise.all([
    synthesizeSpeech(echo.narration_intro, { voiceId }),
    synthesizeSpeech(echo.narration_closing, { voiceId }),
  ]);
  const narrationTransitions: Buffer[] = [];
  for (const text of echo.narration_transitions || []) {
    const buf = await synthesizeSpeech(text, { voiceId }).catch(() => Buffer.alloc(0));
    narrationTransitions.push(buf);
  }

  const themeMusic = await generateMusic(echo.theme_music_prompt, 60000);

  const storyAudios: Buffer[] = [];
  for (const c of clusters) {
    const url = c.story.audio_atmosphere_url || c.story.audio_raw_url;
    if (!url) continue;
    const buf = await fetchBuffer(url).catch(() => Buffer.alloc(0));
    if (buf.length > 0) storyAudios.push(buf);
  }
  if (storyAudios.length === 0) {
    console.warn(`[dailyResonance ${date}] no story audio, aborting`);
    return null;
  }

  const episode = await assembleDailyEcho({
    introMusic: themeMusic,
    narrationIntro,
    stories: storyAudios,
    narrationTransitions,
    narrationClosing,
    outroMusic: themeMusic,
  });

  const audioUrl = await uploadAudio(dailyEchoKey(date), episode);

  const vector = await embed(echo.theme_music_prompt);
  const dominant = clusters[0].emotion;
  const title = `Daily Resonance · ${date} · ${dominant}`;
  const countries = Array.from(
    new Set(clusters.map((c) => c.story.country).filter(Boolean)),
  );
  const totalStorySeconds = clusters.reduce(
    (n, c) => n + (c.story.duration_seconds || 0),
    0,
  );

  const row: ThreadRow = {
    id,
    vector,
    title,
    shared_theme: echo.narration_intro,
    story_ids: clusters.map((c) => c.story.id),
    story_count: clusters.length,
    countries,
    thread_audio_url: audioUrl,
    thread_duration_seconds: totalStorySeconds + 180,
    total_listens: 0,
    total_reactions: 0,
    created_at: new Date().toISOString(),
    is_featured: true,
  };
  await upsertThread(row);

  console.log(`[dailyResonance ${date}] done: ${title}`);
  return {
    id,
    date,
    audioUrl,
    title,
    storyCount: clusters.length,
  };
}

async function fetchBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetchBuffer(${url}) → ${res.status}`);
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}
