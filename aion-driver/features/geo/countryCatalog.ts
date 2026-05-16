import raw from "../../data/geo/iso3166-slim-2.json";

type Row = { name: string; "alpha-2": string };

const rows = raw as Row[];

export type CountryRow = {
  code: string;
  name: string;
  flag: string;
};

function toFlag(alpha2: string): string {
  const c = alpha2.toUpperCase();
  if (!/^[A-Z]{2}$/.test(c)) return "🌍";
  const A = 0x1f1e6;
  return String.fromCodePoint(A + c.charCodeAt(0) - 65, A + c.charCodeAt(1) - 65);
}

/** Локализованное имя региона (CLDR), fallback — англ. из датасета. */
export function localizedCountryName(code: string, localeTag: string, englishFallback: string): string {
  try {
    const dn = new Intl.DisplayNames([localeTag, "en"], { type: "region" });
    return dn.of(code.toUpperCase()) ?? englishFallback;
  } catch {
    return englishFallback;
  }
}

export function buildCountryCatalog(localeTag: string): CountryRow[] {
  const out: CountryRow[] = [];
  for (const r of rows) {
    const code = (r["alpha-2"] ?? "").toUpperCase();
    if (!/^[A-Z]{2}$/.test(code)) continue;
    const name = localizedCountryName(code, localeTag, r.name);
    out.push({ code, name, flag: toFlag(code) });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name, localeTag, { sensitivity: "base" }));
}

export function searchCountries(
  catalog: CountryRow[],
  query: string,
  preferCodes: readonly string[],
): CountryRow[] {
  const q = query.trim().toLowerCase();
  const pref = new Set(preferCodes.map((c) => c.toUpperCase()));
  const preferred = catalog.filter((c) => pref.has(c.code));
  const rest = catalog.filter((c) => !pref.has(c.code));
  if (!q) {
    return [...preferred, ...rest];
  }
  const score = (c: CountryRow) => {
    const lc = c.name.toLowerCase();
    const code = c.code.toLowerCase();
    if (code === q) return 0;
    if (lc.startsWith(q)) return 1;
    if (code.startsWith(q)) return 2;
    if (lc.includes(q)) return 3;
    return 99;
  };
  const filtered = rest.filter((c) => score(c) < 99);
  filtered.sort((a, b) => score(a) - score(b) || a.name.localeCompare(b.name));
  const prefHit = preferred.filter((c) => score(c) < 99);
  prefHit.sort((a, b) => score(a) - score(b) || a.name.localeCompare(b.name));
  return [...prefHit, ...filtered];
}
