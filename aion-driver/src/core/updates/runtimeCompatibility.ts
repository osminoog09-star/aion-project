import { parseSemver, semverLess } from "./semverCompare";

/** Semver runtimes use minimum ordering; opaque runtime fingerprints require equality. */
export function isRuntimeBelowMinimum(current: string, minimum: string): boolean {
  const normalizedCurrent = current.trim();
  const normalizedMinimum = minimum.trim();
  if (parseSemver(normalizedCurrent) && parseSemver(normalizedMinimum)) {
    return semverLess(normalizedCurrent, normalizedMinimum);
  }
  return normalizedCurrent !== normalizedMinimum;
}
