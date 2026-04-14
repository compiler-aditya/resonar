import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { randomUUID } from "node:crypto";

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const MP3_RATE = 44100;
const MP3_BITRATE = "128k";

async function writeTemp(prefix: string, buffer: Buffer): Promise<string> {
  const dir = os.tmpdir();
  const file = path.join(dir, `${prefix}-${randomUUID()}.mp3`);
  await fs.writeFile(file, buffer);
  return file;
}

async function readAndCleanup(file: string, others: string[]): Promise<Buffer> {
  const buf = await fs.readFile(file);
  await Promise.allSettled([file, ...others].map((f) => fs.unlink(f)));
  return buf;
}

export interface MixStoryAtmosphereInput {
  voice: Buffer;
  music: Buffer;
  sfx: Buffer;
  musicVolume: number;
  sfxVolume: number;
  durationSeconds: number;
}

export async function mixStoryAtmosphere(input: MixStoryAtmosphereInput): Promise<Buffer> {
  const voiceFile = await writeTemp("voice", input.voice);
  const musicFile = await writeTemp("music", input.music);
  const sfxFile = await writeTemp("sfx", input.sfx);
  const outFile = path.join(os.tmpdir(), `mix-${randomUUID()}.mp3`);

  const totalSeconds = Math.max(input.durationSeconds, 1);
  const fadeOutStart = Math.max(0, totalSeconds - 3);

  await new Promise<void>((resolve, reject) => {
    ffmpeg()
      .input(voiceFile)
      .input(musicFile)
      .input(sfxFile)
      .complexFilter([
        `[1:a]aloop=loop=-1:size=2e9,atrim=0:${totalSeconds},volume=${input.musicVolume},afade=t=in:st=0:d=2,afade=t=out:st=${fadeOutStart}:d=3[music]`,
        `[2:a]aloop=loop=-1:size=2e9,atrim=0:${totalSeconds},volume=${input.sfxVolume}[sfx]`,
        `[0:a]volume=1.0[voice]`,
        `[voice][music][sfx]amix=inputs=3:duration=first:dropout_transition=0:normalize=0[out]`,
      ])
      .outputOptions([
        "-map", "[out]",
        "-ac", "2",
        "-ar", String(MP3_RATE),
        "-b:a", MP3_BITRATE,
      ])
      .on("error", reject)
      .on("end", () => resolve())
      .save(outFile);
  });

  return readAndCleanup(outFile, [voiceFile, musicFile, sfxFile]);
}

export interface AudioSegment {
  audio: Buffer;
  durationSeconds?: number;
}

export async function concatSegments(segments: AudioSegment[]): Promise<Buffer> {
  if (segments.length === 0) throw new Error("concatSegments: no segments");
  if (segments.length === 1) return segments[0].audio;

  const files: string[] = [];
  for (let i = 0; i < segments.length; i++) {
    files.push(await writeTemp(`seg-${i}`, segments[i].audio));
  }
  const listFile = path.join(os.tmpdir(), `list-${randomUUID()}.txt`);
  await fs.writeFile(
    listFile,
    files.map((f) => `file '${f.replace(/'/g, "'\\''")}'`).join("\n"),
  );
  const outFile = path.join(os.tmpdir(), `concat-${randomUUID()}.mp3`);

  await new Promise<void>((resolve, reject) => {
    ffmpeg()
      .input(listFile)
      .inputOptions(["-f", "concat", "-safe", "0"])
      .outputOptions([
        "-c:a", "libmp3lame",
        "-ac", "2",
        "-ar", String(MP3_RATE),
        "-b:a", MP3_BITRATE,
      ])
      .on("error", reject)
      .on("end", () => resolve())
      .save(outFile);
  });

  return readAndCleanup(outFile, [...files, listFile]);
}

export interface ThreadAssemblyInput {
  intro?: Buffer;
  stories: Buffer[];
  bridges: Buffer[];
  outro?: Buffer;
}

export async function assembleThread(input: ThreadAssemblyInput): Promise<Buffer> {
  const segments: AudioSegment[] = [];
  if (input.intro) segments.push({ audio: input.intro });
  for (let i = 0; i < input.stories.length; i++) {
    segments.push({ audio: input.stories[i] });
    if (i < input.stories.length - 1 && input.bridges[i]) {
      segments.push({ audio: input.bridges[i] });
    }
  }
  if (input.outro) segments.push({ audio: input.outro });
  return concatSegments(segments);
}

export interface DailyEchoAssemblyInput {
  introMusic: Buffer;
  narrationIntro: Buffer;
  story1: Buffer;
  narrationTransition1: Buffer;
  story2: Buffer;
  narrationTransition2: Buffer;
  story3: Buffer;
  narrationClosing: Buffer;
  outroMusic: Buffer;
}

export async function assembleDailyEcho(input: DailyEchoAssemblyInput): Promise<Buffer> {
  return concatSegments([
    { audio: input.introMusic },
    { audio: input.narrationIntro },
    { audio: input.story1 },
    { audio: input.narrationTransition1 },
    { audio: input.story2 },
    { audio: input.narrationTransition2 },
    { audio: input.story3 },
    { audio: input.narrationClosing },
    { audio: input.outroMusic },
  ]);
}

export async function trimToSnippet(buffer: Buffer, seconds: number): Promise<Buffer> {
  const inFile = await writeTemp("full", buffer);
  const outFile = path.join(os.tmpdir(), `snippet-${randomUUID()}.mp3`);
  await new Promise<void>((resolve, reject) => {
    ffmpeg(inFile)
      .setStartTime(0)
      .duration(seconds)
      .outputOptions(["-c:a", "libmp3lame", "-b:a", MP3_BITRATE])
      .on("error", reject)
      .on("end", () => resolve())
      .save(outFile);
  });
  return readAndCleanup(outFile, [inFile]);
}
