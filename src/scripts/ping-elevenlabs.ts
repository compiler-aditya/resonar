/*
 * ElevenLabs connectivity check.
 * Confirms the API key resolves and the narrator voice id exists.
 */
import { elevenlabs, NARRATOR_VOICE_ID } from "../lib/elevenlabs";

async function main() {
  const hasKey = Boolean(process.env.ELEVENLABS_API_KEY);
  console.log(`api key: ${hasKey ? "set" : "MISSING"}`);
  console.log(`narrator voice id: ${NARRATOR_VOICE_ID}`);
  if (!hasKey) process.exit(1);

  const headers = { "xi-api-key": process.env.ELEVENLABS_API_KEY || "" };

  const t0 = Date.now();
  const models = await fetch("https://api.elevenlabs.io/v1/models", { headers });
  if (!models.ok) throw new Error(`/v1/models → ${models.status}`);
  const modelsJson = (await models.json()) as Array<{ model_id: string; name: string }>;
  const hasFlash = modelsJson.some((m) => m.model_id === "eleven_flash_v2_5");
  const hasMusic = modelsJson.some((m) => m.model_id === "music_v1");
  console.log(`✓ /v1/models ok in ${Date.now() - t0}ms — ${modelsJson.length} models`);
  console.log(`  eleven_flash_v2_5: ${hasFlash ? "yes" : "no"}`);
  console.log(`  music_v1: ${hasMusic ? "yes" : "no"}`);

  const t1 = Date.now();
  const voices = await fetch("https://api.elevenlabs.io/v1/voices?page_size=100", { headers });
  if (!voices.ok) throw new Error(`/v1/voices → ${voices.status}`);
  const voicesJson = (await voices.json()) as { voices: Array<{ voice_id: string; name: string }> };
  console.log(`✓ /v1/voices ok in ${Date.now() - t1}ms — ${voicesJson.voices.length} voices in library`);
  const narrator = voicesJson.voices.find((v) => v.voice_id === NARRATOR_VOICE_ID);
  console.log(`  narrator "${NARRATOR_VOICE_ID}": ${narrator ? `found (${narrator.name})` : "NOT FOUND — will fall back at runtime"}`);
  void elevenlabs;
}

main().catch((err) => {
  console.error("✗ ElevenLabs call failed:");
  console.error(err);
  process.exit(1);
});
