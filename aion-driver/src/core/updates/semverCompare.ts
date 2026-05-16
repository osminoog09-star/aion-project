const RE = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/;

export function parseSemver(v: string): [number, number, number] | null {
  const m = v.trim().match(RE);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

/** true если a < b */
export function semverLess(a: string, b: string): boolean {
  const pa = parseSemver(a);
  const pb = parseSemver(b);
  if (!pa || !pb) return false;
  for (let i = 0; i < 3; i++) {
    if (pa[i] < pb[i]) return true;
    if (pa[i] > pb[i]) return false;
  }
  return false;
}

export function semverLessOrEq(a: string, b: string): boolean {
  return semverLess(a, b) || normalize(a) === normalize(b);
}

function normalize(v: string): string {
  return v.trim().replace(/^v/i, "");
}
