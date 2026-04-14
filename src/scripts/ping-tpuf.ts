/*
 * Minimal turbopuffer connectivity check.
 * Lists namespaces and reports round-trip latency.
 */
import { tpuf } from "../lib/turbopuffer";

async function main() {
  const region = process.env.TURBOPUFFER_REGION;
  const hasKey = Boolean(process.env.TURBOPUFFER_API_KEY);
  console.log(`region: ${region}`);
  console.log(`api key: ${hasKey ? "set" : "MISSING"}`);
  if (!hasKey) process.exit(1);

  const t0 = Date.now();
  const page = await tpuf.namespaces({ page_size: 20 });
  const elapsed = Date.now() - t0;
  const names: string[] = [];
  for await (const ns of page) {
    names.push((ns as { id?: string }).id || JSON.stringify(ns));
    if (names.length >= 20) break;
  }
  console.log(`✓ listed ${names.length} namespace(s) in ${elapsed}ms`);
  for (const n of names) console.log(`  · ${n}`);
}

main().catch((err) => {
  console.error("✗ turbopuffer call failed:");
  console.error(err);
  process.exit(1);
});
