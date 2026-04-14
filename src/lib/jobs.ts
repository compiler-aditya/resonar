import { PgBoss } from "pg-boss";

export const JOB_PROCESS_STORY = "process-story";
export const JOB_BUILD_THREAD = "build-thread";
export const JOB_DAILY_ECHO = "daily-resonance";
export const JOB_WHISPER_PROMPTS = "whisper-prompts";

export interface ProcessStoryJobData {
  storyJobId: string;
  guestId: string;
  username: string;
  rawAudioKey: string;
  rawAudioUrl: string;
  durationSeconds: number;
  promptId?: string;
}

export interface BuildThreadJobData {
  storyId: string;
}

let bossSingleton: PgBoss | null = null;
let startPromise: Promise<PgBoss> | null = null;

export function getBoss(): Promise<PgBoss> {
  if (bossSingleton) return Promise.resolve(bossSingleton);
  if (startPromise) return startPromise;
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return Promise.reject(new Error("[jobs] DATABASE_URL not set"));
  }
  const boss = new PgBoss({ connectionString: databaseUrl });
  boss.on("error", (err: unknown) => console.error("[pg-boss]", err));
  const promise = boss.start().then(async () => {
    bossSingleton = boss;
    await boss.createQueue(JOB_PROCESS_STORY).catch(() => {});
    await boss.createQueue(JOB_BUILD_THREAD).catch(() => {});
    await boss.createQueue(JOB_DAILY_ECHO).catch(() => {});
    await boss.createQueue(JOB_WHISPER_PROMPTS).catch(() => {});
    return boss;
  });
  startPromise = promise;
  return promise;
}

export async function enqueueProcessStory(data: ProcessStoryJobData): Promise<string | null> {
  const boss = await getBoss();
  return boss.send(JOB_PROCESS_STORY, data, { retryLimit: 3, retryBackoff: true });
}

export async function enqueueBuildThread(data: BuildThreadJobData): Promise<string | null> {
  const boss = await getBoss();
  return boss.send(JOB_BUILD_THREAD, data, { retryLimit: 2, retryBackoff: true });
}
