import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const persist = readFileSync("src/lib/operations/priorities-persist.ts", "utf8");
const migration = readFileSync(
  "aion-driver/supabase/migrations/20260623200000_unique_public_snapshot_kind.sql",
  "utf8",
);

assert.match(persist, /\.upsert\(row, \{ onConflict: "kind" \}\)/);
assert.doesNotMatch(persist, /select\("id"\)[\s\S]*?insert\(row\)/);
assert.match(migration, /delete from public\.ecosystem_public_snapshots as older/i);
assert.match(migration, /create unique index if not exists ecosystem_public_snapshots_kind_uidx/i);
assert.match(migration, /\(kind\)/i);

console.log("priorities persistence: OK (singleton kind + atomic Supabase upsert)");
