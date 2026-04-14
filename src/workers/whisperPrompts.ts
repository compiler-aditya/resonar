import { randomUUID } from "node:crypto";
import {
  aggregateEmotions,
  upsertWhisperPrompt,
  type WhisperPromptRow,
} from "../lib/turbopuffer";
import { generateWhisperPrompts, embed } from "../lib/gemini";
import { synthesizeSpeech, NARRATOR_VOICE_ID } from "../lib/elevenlabs";
import { uploadAudio, whisperPromptKey } from "../lib/storage";

const BASELINE_EMOTIONS = [
  "joy",
  "gratitude",
  "nostalgia",
  "tenderness",
  "loneliness",
  "anger",
  "grief",
  "excitement",
  "defiance",
  "anxiety",
];

export async function generateWhisperPromptsBatch(): Promise<
  Array<{ id: string; prompt_text: string; target_emotion: string; prompt_audio_url: string }>
> {
  const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
  const dist = await aggregateEmotions({ sinceIso: since });
  const totals: Record<string, number> = {};
  for (const row of dist) {
    if (!row.emotion_primary || row.emotion_primary === "warmup") continue;
    totals[row.emotion_primary] = (totals[row.emotion_primary] ?? 0) + row.count;
  }
  const total = Object.values(totals).reduce((a, b) => a + b, 0);

  const gaps: string[] = BASELINE_EMOTIONS.filter((e) => {
    if (total === 0) return true;
    const share = (totals[e] ?? 0) / total;
    return share < 0.08;
  }).slice(0, 5);

  if (gaps.length === 0) {
    gaps.push("gratitude", "tenderness", "joy");
  }

  console.log(`[whisperPrompts] underrepresented emotions:`, gaps);

  const prompts = await generateWhisperPrompts({ underrepresented: gaps });
  const voiceId = NARRATOR_VOICE_ID;
  const now = new Date().toISOString();
  const out: Array<{
    id: string;
    prompt_text: string;
    target_emotion: string;
    prompt_audio_url: string;
  }> = [];

  for (const p of prompts) {
    try {
      const id = randomUUID();
      const audio = await synthesizeSpeech(p.prompt_text, { voiceId });
      const audioUrl = await uploadAudio(whisperPromptKey(id), audio);
      const vector = await embed(`${p.target_emotion}: ${p.prompt_text}`);
      const row: WhisperPromptRow = {
        id,
        vector,
        prompt_text: p.prompt_text,
        prompt_audio_url: audioUrl,
        target_emotion: p.target_emotion,
        target_theme: p.target_theme || "",
        response_count: 0,
        created_at: now,
        is_active: true,
      };
      await upsertWhisperPrompt(row);
      out.push({
        id,
        prompt_text: p.prompt_text,
        target_emotion: p.target_emotion,
        prompt_audio_url: audioUrl,
      });
    } catch (err) {
      console.error("[whisperPrompts] failed to persist one prompt", err);
    }
  }

  return out;
}
