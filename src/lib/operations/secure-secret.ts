import { createHash, timingSafeEqual } from "node:crypto";

export function secureSecretMatches(
  candidate: string | undefined | null,
  expected: string | undefined | null,
  minimumLength = 16,
): boolean {
  if (!candidate || !expected || expected.length < minimumLength) return false;
  const candidateDigest = createHash("sha256").update(candidate).digest();
  const expectedDigest = createHash("sha256").update(expected).digest();
  return timingSafeEqual(candidateDigest, expectedDigest);
}
