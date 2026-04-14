import { warmAllCaches } from "./turbopuffer";

let booted = false;

export function ensureBooted() {
  if (booted) return;
  booted = true;
  if (process.env.TURBOPUFFER_API_KEY) {
    warmAllCaches().catch((err) =>
      console.warn("[bootstrap] warm caches failed", err),
    );
  }
}
