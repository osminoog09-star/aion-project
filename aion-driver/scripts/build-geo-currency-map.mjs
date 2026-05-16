/**
 * One-off generator: reads data/geo/country-codes.csv → features/geo/generatedAlpha2ToCurrency.ts
 * Run: node scripts/build-geo-currency-map.mjs
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const csvPath = join(root, "data", "geo", "country-codes.csv");
const outDir = join(root, "features", "geo");
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, "generatedAlpha2ToCurrency.ts");

const raw = readFileSync(csvPath, "utf8");
const lines = raw.split(/\r?\n/).filter(Boolean);
const headerCols = parseRow(lines[0]);
const idxAlpha = headerCols.indexOf("ISO3166-1-Alpha-2");
const idxCur = headerCols.indexOf("ISO4217-currency_alphabetic_code");
if (idxAlpha < 0 || idxCur < 0) {
  console.error("Missing columns", idxAlpha, idxCur);
  process.exit(1);
}

/** Minimal CSV row split respecting quoted fields */
function parseRow(line) {
  const out = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      inQ = !inQ;
      continue;
    }
    if (ch === "," && !inQ) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

const map = {};
for (let i = 1; i < lines.length; i += 1) {
  const cols = parseRow(lines[i]);
  const alpha = (cols[idxAlpha] ?? "").trim().toUpperCase();
  const cur = (cols[idxCur] ?? "").trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(alpha) || !/^[A-Z]{3}$/.test(cur)) continue;
  map[alpha] = cur;
}

const uniq = [...new Set(Object.values(map))].sort();

const body = `/* eslint-disable */
/** Auto-generated from data/geo/country-codes.csv — do not edit by hand. */
export const ALPHA2_TO_ISO4217: Record<string, string> = ${JSON.stringify(map, null, 0)};

/** All ISO 4217 alphabetic codes present in the country dataset (for typing + pickers). */
export const KNOWN_ISO4217_CURRENCIES = ${JSON.stringify(uniq)} as const;
export type AppCurrencyCode = (typeof KNOWN_ISO4217_CURRENCIES)[number];
`;

writeFileSync(outPath, body, "utf8");
console.log("Wrote", outPath, "entries", Object.keys(map).length);
