/*
 * R2 round-trip connectivity check.
 * Uploads a tiny text file, fetches it back via the public URL,
 * then deletes it.
 */
import { s3, uploadAudio } from "../lib/storage";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";

async function main() {
  const keys = [
    "R2_ACCOUNT_ID",
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
    "R2_BUCKET",
    "R2_PUBLIC_URL",
  ];
  for (const k of keys) {
    const v = process.env[k];
    console.log(`${k}: ${v ? (k.includes("SECRET") ? "set (hidden)" : v) : "MISSING"}`);
  }

  const now = new Date().toISOString();
  const body = Buffer.from(`resonar r2 ping · ${now}\n`);
  const key = `_diagnostics/ping-${Date.now()}.txt`;

  const t0 = Date.now();
  const publicUrl = await uploadAudio(key, body, "text/plain");
  console.log(`✓ PUT ok in ${Date.now() - t0}ms → ${publicUrl}`);

  const t1 = Date.now();
  const res = await fetch(publicUrl);
  if (!res.ok) throw new Error(`GET ${publicUrl} → ${res.status}`);
  const text = await res.text();
  console.log(`✓ GET ok in ${Date.now() - t1}ms (${text.length} bytes)`);
  console.log(`  body: ${text.trim()}`);

  await s3.send(
    new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET!,
      Key: key,
    }),
  );
  console.log(`✓ DELETE ok`);
  console.log(`\nR2 is fully wired.`);
}

main().catch((err) => {
  console.error("✗ R2 ping failed:");
  console.error(err);
  process.exit(1);
});
