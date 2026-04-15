import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("[gemini] GEMINI_API_KEY not set — story analysis will fail");
}

const genai = new GoogleGenerativeAI(apiKey || "");

const FLASH_MODEL = "gemini-2.5-flash";
const EMBED_MODEL = "gemini-embedding-001";
const EMBED_DIM = 768;

export interface StoryAnalysis {
  emotion_primary: string;
  emotion_secondary: string;
  intensity: number;
  valence: number;
  themes: string[];
  emotional_essence: string;
  music_prompt: string;
  sfx_prompt: string;
  music_volume: number;
  sfx_volume: number;
}

const STORY_ANALYSIS_PROMPT = `You are an audio producer analyzing a voice note for an audio social platform.
Voice notes can come in ANY language — Spanish, Hindi, Arabic, Mandarin, French, Japanese, Portuguese, etc.
Analyze the transcript and generate both emotional metadata AND audio production prompts.

TRANSCRIPT:
"{transcript}"

DETECTED LANGUAGE CODE: {language}
STORY DURATION: {duration} seconds

Return ONLY valid JSON (no markdown, no backticks):
{
  "emotion_primary": "<single ENGLISH word from this fixed taxonomy: joy, loneliness, anger, nostalgia, grief, excitement, anxiety, gratitude, defiance, tenderness, hope, fear, awe, shame, pride, longing, contentment, love. ALWAYS English regardless of transcript language so the UI can colour the chip.>",
  "emotion_secondary": "<single ENGLISH word from the same taxonomy — the undertone>",
  "intensity": <1-10 integer — how emotionally charged is this>,
  "valence": <-1.0 to 1.0 float — negative=dark/heavy, positive=bright/light>,
  "themes": ["short English tag", "short English tag", "short English tag"],
  "emotional_essence": "<2-3 sentences in the ORIGINAL transcript language ({language}). If the transcript is Spanish, write Spanish. If Hindi, write Hindi. If Arabic, write Arabic. NEVER translate to English. Capture what this story is REALLY about emotionally — the emotional truth, not a literal summary. This is what listeners will read on the story card, so it must feel native to the speaker.>",
  "music_prompt": "<MAX 50 WORDS. ALWAYS in English regardless of transcript language — ElevenLabs Music API performs best with English prompts. Instrumental background music that fits THIS specific story. Include: genre/style, tempo (BPM), key/mode, primary instruments, energy level, emotional arc. Must be instrumental only. Do NOT mention any artist or band names. Example: 'Gentle fingerpicked acoustic guitar in A minor, 68 BPM, with soft sustained cello underneath, slowly building warmth, bittersweet and intimate like a late-night kitchen conversation'>",
  "sfx_prompt": "<MAX 30 WORDS. ALWAYS in English. Ambient environmental sounds that place the listener in the world of THIS story. Be specific to the setting and mood. Example: 'Soft rain on a tin roof, distant thunder, kettle whistling, old wooden chair creaking'>",
  "music_volume": <0.10-0.25 float — lower for intense/quiet stories, higher for energetic ones>,
  "sfx_volume": <0.05-0.15 float — subtle, never overpowering the voice>
}

LANGUAGE RULES (CRITICAL):
- emotion_primary, emotion_secondary, themes: ALWAYS English (single words) so the UI taxonomy works
- emotional_essence: SAME language as the transcript — preserve the speaker's voice, never translate
- music_prompt, sfx_prompt: ALWAYS English so ElevenLabs Music + SFX APIs render correctly
- If the speaker references a culturally specific place or instrument (sitar, koto, accordion, oud, mariachi, taiko, gamelan, etc.), include it in the music/sfx prompt for authenticity

RULES FOR AUDIO PROMPTS:
- music_prompt must be specific to THIS story's content and setting, not generic mood music
- If the story mentions a place, reflect that place's sonic character in the prompts
- If the story mentions a time of day, reflect that in the ambient sounds
- If the story has humor, the music should be lighter — not dramatic
- If the story is raw/vulnerable, keep music sparse and intimate — don't overproduce
- sfx_prompt should evoke the WORLD the storyteller is describing, not just generic ambience
- Both prompts must be concise — ElevenLabs performs best with focused, specific prompts`;

async function withGeminiRetry<T>(label: string, fn: () => Promise<T>, maxAttempts = 4): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      const is503 = /503|unavailable|high demand|overloaded/i.test(msg);
      const is429 = /429|rate/i.test(msg);
      const retryable = is503 || is429;
      console.warn(`[gemini] ${label} attempt ${attempt} failed: ${msg.slice(0, 140)}`);
      if (!retryable || attempt === maxAttempts) break;
      const delay = 1500 * Math.pow(2, attempt - 1);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

function stripJsonFences(text: string): string {
  let t = text.trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  }
  return t.trim();
}

function parseJsonWithRepair<T>(text: string): T {
  const cleaned = stripJsonFences(text);
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1)) as T;
    }
    throw new Error(`Could not parse JSON from model output: ${cleaned.slice(0, 200)}`);
  }
}

export async function analyzeStory(
  transcript: string,
  durationSeconds: number,
  languageCode = "auto",
): Promise<StoryAnalysis> {
  const model = genai.getGenerativeModel({
    model: FLASH_MODEL,
    generationConfig: { responseMimeType: "application/json", temperature: 0.7 },
  });
  const prompt = STORY_ANALYSIS_PROMPT
    .replace("{transcript}", transcript.replace(/"/g, '\\"'))
    .replace(/\{language\}/g, languageCode)
    .replace("{duration}", String(Math.round(durationSeconds)));
  const text = await withGeminiRetry("analyzeStory", async () => {
    const res = await model.generateContent(prompt);
    return res.response.text();
  });
  const parsed = parseJsonWithRepair<StoryAnalysis>(text);
  return {
    emotion_primary: String(parsed.emotion_primary || "reflection"),
    emotion_secondary: String(parsed.emotion_secondary || "quiet"),
    intensity: Math.max(1, Math.min(10, Math.round(Number(parsed.intensity) || 5))),
    valence: Math.max(-1, Math.min(1, Number(parsed.valence) || 0)),
    themes: Array.isArray(parsed.themes) ? parsed.themes.slice(0, 5) : [],
    emotional_essence: String(parsed.emotional_essence || ""),
    music_prompt: String(parsed.music_prompt || "soft instrumental ambient piano, 60 BPM, reflective"),
    sfx_prompt: String(parsed.sfx_prompt || "quiet room tone, distant breath, subtle hum"),
    music_volume: clamp(Number(parsed.music_volume) || 0.15, 0.08, 0.28),
    sfx_volume: clamp(Number(parsed.sfx_volume) || 0.08, 0.04, 0.18),
  };
}

export interface ThreadBridge {
  bridge_music_prompt: string;
  bridge_sfx_prompt: string;
}

export async function generateThreadBridge(
  storyAEssence: string,
  storyBEssence: string,
  sharedTheme: string,
): Promise<ThreadBridge> {
  const model = genai.getGenerativeModel({
    model: FLASH_MODEL,
    generationConfig: { responseMimeType: "application/json", temperature: 0.7 },
  });
  const prompt = `You are scoring the musical bridges between stories in a Resonance Thread.
These stories share a common emotional thread. Generate a bridge prompt
that musically transitions between two adjacent stories.

STORY A (ending): "${storyAEssence}"
STORY B (beginning): "${storyBEssence}"
SHARED THEME: "${sharedTheme}"

Return ONLY valid JSON:
{
  "bridge_music_prompt": "<MAX 40 WORDS. An 8-second instrumental transition that emotionally connects Story A's ending to Story B's beginning. Reflect the shared theme musically.>",
  "bridge_sfx_prompt": "<MAX 20 WORDS. A 3-second transition sound — a texture shift, not a whoosh.>"
}`;
  const res = await model.generateContent(prompt);
  const text = res.response.text();
  return parseJsonWithRepair<ThreadBridge>(text);
}

export interface ThreadTitle {
  title: string;
  shared_theme: string;
}

export async function generateThreadTitle(
  essences: string[],
): Promise<ThreadTitle> {
  const model = genai.getGenerativeModel({
    model: FLASH_MODEL,
    generationConfig: { responseMimeType: "application/json", temperature: 0.8 },
  });
  const prompt = `You are naming a Resonance Thread — a group of voice stories from different strangers that share a common emotional thread.

STORIES:
${essences.map((e, i) => `${i + 1}. ${e}`).join("\n")}

Return ONLY valid JSON:
{
  "title": "<max 8 words, poetic, first-person or observation — e.g. 'What home sounds like', 'The text I never sent'>",
  "shared_theme": "<1 sentence describing what these stories have in common emotionally>"
}`;
  const res = await model.generateContent(prompt);
  return parseJsonWithRepair<ThreadTitle>(res.response.text());
}

export interface DailyEcho {
  narration_intro: string;
  narration_transitions: string[];
  narration_closing: string;
  theme_music_prompt: string;
  ambient_sfx_prompt: string;
}

export async function generateDailyEcho(input: {
  date: string;
  clusters: Array<{ emotion: string; count: number; story_essence: string; username: string; country: string }>;
}): Promise<DailyEcho> {
  const model = genai.getGenerativeModel({
    model: FLASH_MODEL,
    generationConfig: { responseMimeType: "application/json", temperature: 0.75 },
  });
  const clusterText = input.clusters
    .map((c, i) => `${i + 1}. Mood: ${c.emotion} (${c.count} stories). Featured story by ${c.username} from ${c.country}: "${c.story_essence}"`)
    .join("\n");
  const prompt = `You are the warm, gentle podcast host of "Daily Resonance" — a 5-minute episode produced daily from voice stories shared on Resonar.

Date: ${input.date}

Today's top mood clusters:
${clusterText}

Return ONLY valid JSON:
{
  "narration_intro": "<1-2 sentences opening the episode. Reference today's dominant mood. Warm, inviting. 'Today, the world was mostly feeling...'>",
  "narration_transitions": ["<1 sentence introducing story 2>", "<1 sentence introducing story 3>"],
  "narration_closing": "<1-2 sentences closing reflection on today's collective mood. Always hopeful, even on heavy days.>",
  "theme_music_prompt": "<MAX 50 WORDS. 60s instrumental theme capturing today's collective mood. Mid-tempo, not too busy (plays under narration). Podcast intro energy — inviting.>",
  "ambient_sfx_prompt": "<MAX 25 WORDS. Continuous ambient texture for the full episode.>"
}`;
  const res = await model.generateContent(prompt);
  return parseJsonWithRepair<DailyEcho>(res.response.text());
}

export interface WhisperPromptOut {
  prompt_text: string;
  target_emotion: string;
  target_theme: string;
}

export async function generateWhisperPrompts(input: {
  underrepresented: string[];
}): Promise<WhisperPromptOut[]> {
  const model = genai.getGenerativeModel({
    model: FLASH_MODEL,
    generationConfig: { responseMimeType: "application/json", temperature: 0.9 },
  });
  const prompt = `Generate 3 short story prompts for an audio social platform. These prompts should invite people to share 1-3 minute voice notes.

UNDERREPRESENTED EMOTIONS (we need more stories about these):
${input.underrepresented.join(", ")}

Return ONLY valid JSON — an array of 3 prompt objects:
[
  {
    "prompt_text": "<max 20 words, inviting, specific — e.g. 'Tell us about a stranger who was unexpectedly kind to you.'>",
    "target_emotion": "<single word from the underrepresented list>",
    "target_theme": "<1-3 word theme>"
  },
  ...
]`;
  const res = await model.generateContent(prompt);
  const parsed = parseJsonWithRepair<WhisperPromptOut[] | { prompts: WhisperPromptOut[] }>(res.response.text());
  return Array.isArray(parsed) ? parsed : (parsed.prompts || []);
}

export async function embed(text: string): Promise<number[]> {
  const model = genai.getGenerativeModel({ model: EMBED_MODEL });
  const values = await withGeminiRetry("embed", async () => {
    const res = await model.embedContent({
      content: { role: "user", parts: [{ text }] },
      outputDimensionality: EMBED_DIM,
    } as unknown as Parameters<typeof model.embedContent>[0]);
    return res.embedding.values;
  });
  if (values.length !== EMBED_DIM) {
    throw new Error(`embed: expected ${EMBED_DIM} dims, got ${values.length}`);
  }
  return values;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}
