import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const apiKey = process.env.ELEVENLABS_API_KEY;
const narratorVoiceId = process.env.ELEVENLABS_NARRATOR_VOICE_ID || "JBFqnCBsd6RMkjVDRZzb";

if (!apiKey) {
  console.warn("[elevenlabs] ELEVENLABS_API_KEY not set");
}

export const elevenlabs = new ElevenLabsClient({ apiKey: apiKey || "" });

export const NARRATOR_VOICE_ID = narratorVoiceId;

type BudgetCounters = {
  music: number;
  sfx: number;
  tts: number;
  stt: number;
  startedAt: number;
};

const budget: BudgetCounters = {
  music: 0,
  sfx: 0,
  tts: 0,
  stt: 0,
  startedAt: Date.now(),
};

const BUDGET_WARN = {
  music: 80,
  sfx: 200,
  tts: 200,
  stt: 200,
};

function trackUsage(kind: keyof Omit<BudgetCounters, "startedAt">) {
  budget[kind] += 1;
  if (budget[kind] === BUDGET_WARN[kind]) {
    console.warn(`[elevenlabs] budget warning: reached ${budget[kind]} ${kind} calls this session`);
  }
}

export function getUsage() {
  return { ...budget, uptimeMs: Date.now() - budget.startedAt };
}

async function streamToBuffer(stream: ReadableStream<Uint8Array>): Promise<Buffer> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  return Buffer.concat(chunks.map((c) => Buffer.from(c)));
}

async function withRetry<T>(
  label: string,
  fn: () => Promise<T>,
  maxAttempts = 3,
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      const status = (err as { statusCode?: number; status?: number })?.statusCode
        ?? (err as { statusCode?: number; status?: number })?.status;
      const retryable = !status || status === 429 || status >= 500;
      console.warn(`[elevenlabs] ${label} attempt ${attempt} failed (${status ?? "?"}): ${msg}`);
      if (!retryable || attempt === maxAttempts) break;
      await new Promise((r) => setTimeout(r, 1500 * Math.pow(2, attempt - 1)));
    }
  }
  throw lastErr;
}

export interface TranscribeResult {
  text: string;
  languageCode: string;
  durationSeconds: number;
}

export async function transcribeAudio(
  audio: Buffer,
  mime: string = "audio/mpeg",
): Promise<TranscribeResult> {
  trackUsage("stt");
  return withRetry("stt", async () => {
    const ab = audio.buffer.slice(audio.byteOffset, audio.byteOffset + audio.byteLength) as ArrayBuffer;
    const blob = new Blob([ab], { type: mime });
    const res = await elevenlabs.speechToText.convert({
      modelId: "scribe_v2",
      file: blob as unknown as Blob,
      tagAudioEvents: false,
      diarize: false,
    });
    const any = res as unknown as {
      text?: string;
      language_code?: string;
      languageCode?: string;
      words?: Array<{ end?: number }>;
    };
    const words = any.words ?? [];
    const last = words.length > 0 ? words[words.length - 1] : undefined;
    return {
      text: any.text ?? "",
      languageCode: any.language_code ?? any.languageCode ?? "en",
      durationSeconds: last?.end ?? 0,
    };
  });
}

export async function synthesizeSpeech(
  text: string,
  opts: { voiceId?: string; modelId?: string } = {},
): Promise<Buffer> {
  trackUsage("tts");
  return withRetry("tts", async () => {
    const voiceId = opts.voiceId || NARRATOR_VOICE_ID;
    const stream = await elevenlabs.textToSpeech.convert(voiceId, {
      text,
      modelId: opts.modelId || "eleven_flash_v2_5",
      outputFormat: "mp3_44100_128",
    });
    return streamToBuffer(stream as unknown as ReadableStream<Uint8Array>);
  });
}

export async function generateMusic(
  prompt: string,
  durationMs: number,
): Promise<Buffer> {
  trackUsage("music");
  const clampedMs = Math.min(Math.max(durationMs, 10000), 180000);
  return withRetry("music", async () => {
    const stream = await elevenlabs.music.compose({
      prompt,
      musicLengthMs: clampedMs,
      modelId: "music_v1",
      forceInstrumental: true,
      outputFormat: "mp3_44100_128",
    });
    return streamToBuffer(stream as unknown as ReadableStream<Uint8Array>);
  });
}

export async function generateSFX(
  prompt: string,
  durationSeconds: number,
  opts: { loop?: boolean; promptInfluence?: number } = {},
): Promise<Buffer> {
  trackUsage("sfx");
  const dur = Math.min(Math.max(durationSeconds, 1), 30);
  return withRetry("sfx", async () => {
    const stream = await elevenlabs.textToSoundEffects.convert({
      text: prompt,
      durationSeconds: dur,
      loop: opts.loop ?? true,
      promptInfluence: opts.promptInfluence ?? 0.3,
      outputFormat: "mp3_44100_128",
    });
    return streamToBuffer(stream as unknown as ReadableStream<Uint8Array>);
  });
}
