/**
 * Print Vercel env vars checklist (no secrets). Seed is in Supabase ecosystem_public_snapshots.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const example = fs.readFileSync(path.join(root, ".env.local.example"), "utf8");

console.log("\n=== Vercel → Project aion-com → Environment Variables ===\n");
console.log("Required for durable device heartbeat on production:\n");
for (const line of example.split("\n")) {
  if (line.startsWith("NEXT_PUBLIC_SUPABASE") || line.startsWith("OPERATIONS_SUPABASE")) {
    console.log(`  ${line}`);
  }
}
console.log("\nAnon key: Supabase Dashboard → Project Settings → API → anon public");
console.log("Service role: same page (server-only, never expose to client)\n");
console.log("After save: Redeploy production, then open Driver once.\n");
