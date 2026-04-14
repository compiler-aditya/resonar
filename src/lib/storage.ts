import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucket = process.env.R2_BUCKET || "resonar-audio";
const publicUrl = process.env.R2_PUBLIC_URL || "";

if (!accountId || !accessKeyId || !secretAccessKey) {
  console.warn("[storage] R2 credentials missing — uploads will fail");
}

export const s3 = new S3Client({
  region: "auto",
  endpoint: accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined,
  credentials: {
    accessKeyId: accessKeyId || "",
    secretAccessKey: secretAccessKey || "",
  },
});

export async function uploadAudio(
  key: string,
  buffer: Buffer,
  contentType = "audio/mpeg",
): Promise<string> {
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
  return publicUrlFor(key);
}

export async function uploadImage(
  key: string,
  buffer: Buffer,
  contentType = "image/png",
): Promise<string> {
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
  return publicUrlFor(key);
}

export function publicUrlFor(key: string): string {
  if (!publicUrl) {
    return `https://${accountId || "unknown"}.r2.cloudflarestorage.com/${bucket}/${key}`;
  }
  const base = publicUrl.replace(/\/$/, "");
  return `${base}/${key}`;
}

export function storyRawKey(storyId: string): string {
  return `stories/${storyId}/raw.mp3`;
}

export function storyAtmosphereKey(storyId: string): string {
  return `stories/${storyId}/atmosphere.mp3`;
}

export function threadAudioKey(threadId: string): string {
  return `threads/${threadId}.mp3`;
}

export function dailyEchoKey(date: string): string {
  return `daily/${date}.mp3`;
}

export function whisperPromptKey(promptId: string): string {
  return `prompts/${promptId}.mp3`;
}
