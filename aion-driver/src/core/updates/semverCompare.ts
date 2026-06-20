const RE = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/;

type ParsedSemver = {
  core: [number, number, number];
  prerelease: string[] | null;
};

function parseDetailed(v: string): ParsedSemver | null {
  const m = v.trim().match(RE);
  if (!m) return null;
  const prerelease = m[4]?.split(".") ?? null;
  if (prerelease?.some((id) => !id || (/^\d+$/.test(id) && id.length > 1 && id.startsWith("0")))) {
    return null;
  }
  return {
    core: [Number(m[1]), Number(m[2]), Number(m[3])],
    prerelease,
  };
}

export function parseSemver(v: string): [number, number, number] | null {
  return parseDetailed(v)?.core ?? null;
}

function compareIdentifiers(a: string, b: string): number {
  const aNumeric = /^\d+$/.test(a);
  const bNumeric = /^\d+$/.test(b);
  if (aNumeric && bNumeric) return Number(a) - Number(b);
  if (aNumeric !== bNumeric) return aNumeric ? -1 : 1;
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

export function compareSemver(a: string, b: string): number | null {
  const pa = parseDetailed(a);
  const pb = parseDetailed(b);
  if (!pa || !pb) return null;
  for (let i = 0; i < 3; i++) {
    if (pa.core[i] !== pb.core[i]) return pa.core[i] < pb.core[i] ? -1 : 1;
  }
  if (!pa.prerelease && !pb.prerelease) return 0;
  if (!pa.prerelease) return 1;
  if (!pb.prerelease) return -1;
  const length = Math.max(pa.prerelease.length, pb.prerelease.length);
  for (let i = 0; i < length; i++) {
    const ai = pa.prerelease[i];
    const bi = pb.prerelease[i];
    if (ai == null) return -1;
    if (bi == null) return 1;
    const compared = compareIdentifiers(ai, bi);
    if (compared !== 0) return compared < 0 ? -1 : 1;
  }
  return 0;
}

/** true если a < b */
export function semverLess(a: string, b: string): boolean {
  return compareSemver(a, b) === -1;
}

export function semverLessOrEq(a: string, b: string): boolean {
  const compared = compareSemver(a, b);
  return compared != null && compared <= 0;
}
