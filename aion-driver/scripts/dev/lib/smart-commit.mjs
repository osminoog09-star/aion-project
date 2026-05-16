/**
 * Конвенциональные префиксы + короткий subject по списку файлов.
 * @param {string[]} files -- относительные пути
 */
export function inferConventionalPrefix(files) {
  if (files.length === 0) return "chore";

  const score = { feat: 0, fix: 0, docs: 0, chore: 0, ui: 0, perf: 0, refactor: 0 };

  for (const p of files) {
    const low = p.toLowerCase();
    if (low.startsWith("docs/") || low.endsWith(".md")) score.docs += 3;
    if (low.startsWith(".github/") || low.startsWith("scripts/")) score.chore += 2;
    if (low === "package.json" || low === "package-lock.json" || low === "eas.json" || low.endsWith("app.config.ts"))
      score.chore += 2;
    if (low.startsWith("tokens/") || low.includes("global.css") || low.includes("tailwind")) score.ui += 2;
    if (low.includes("perf") || low.includes("reanimated") || low.includes("memo")) score.perf += 1;
    if (low.startsWith("refactor") || low.includes("/lib/")) score.refactor += 1;
    if (low.startsWith("fix") || low.includes("sentry") || low.includes("errorboundary")) score.fix += 1;
    if (
      low.startsWith("app/") ||
      low.startsWith("screens/") ||
      low.startsWith("components/") ||
      low.startsWith("features/") ||
      low.startsWith("src/")
    )
      score.feat += 2;
  }

  const order = ["docs", "chore", "ui", "perf", "refactor", "fix", "feat"];
  let best = "feat";
  let bestV = -1;
  for (const k of order) {
    if (score[k] > bestV) {
      bestV = score[k];
      best = k;
    }
  }
  if (bestV === 0) return "feat";
  return best;
}

export function shortenSubject(s, max = 72) {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

/**
 * @param {string[]} files
 */
export function filesToSubject(files) {
  const roots = [...new Set(files.map((f) => f.split(/[/\\]/)[0]).filter(Boolean))];
  const tail = roots.length ? roots.slice(0, 5).join(", ") : "workspace";
  return shortenSubject(`${tail} (${files.length} files)`);
}

/**
 * @param {string} userMessage -- если передан --message
 */
export function buildCommitMessage({ files, userMessage }) {
  if (userMessage && String(userMessage).trim()) {
    const m = String(userMessage).trim();
    if (/^(feat|fix|docs|chore|refactor|perf|ui)(\([^)]*\))?:/i.test(m)) return m;
    const prefix = inferConventionalPrefix(files);
    return `${prefix}: ${m}`;
  }
  const prefix = inferConventionalPrefix(files);
  const subj = filesToSubject(files);
  return shortenSubject(`${prefix}: ${subj}`);
}
