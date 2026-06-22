import { createHmac } from "node:crypto";
import { secureSecretMatches } from "@/lib/operations/secure-secret";

export const OWNER_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

const TOKEN_VERSION = "v2";
const MAX_CLOCK_SKEW_SECONDS = 60 * 5;
const SIGNATURE_LENGTH = 64;

function signIssuedAt(secret: string, issuedAtSeconds: number): string {
  return createHmac("sha256", secret)
    .update(`aion-owner-${TOKEN_VERSION}:${issuedAtSeconds}`)
    .digest("hex");
}

export function buildOwnerSessionToken(secret: string, nowMs = Date.now()): string {
  const issuedAtSeconds = Math.floor(nowMs / 1000);
  return `${TOKEN_VERSION}.${issuedAtSeconds}.${signIssuedAt(secret, issuedAtSeconds)}`;
}

export function verifyOwnerSessionToken(
  value: string | undefined,
  secret: string,
  nowMs = Date.now(),
): boolean {
  if (!value) return false;
  const [version, issuedAtRaw, signature, extra] = value.split(".");
  if (version !== TOKEN_VERSION || !issuedAtRaw || !signature || extra !== undefined) return false;
  if (!/^\d+$/.test(issuedAtRaw) || signature.length !== SIGNATURE_LENGTH) return false;

  const issuedAtSeconds = Number(issuedAtRaw);
  const nowSeconds = Math.floor(nowMs / 1000);
  if (!Number.isSafeInteger(issuedAtSeconds)) return false;
  if (issuedAtSeconds > nowSeconds + MAX_CLOCK_SKEW_SECONDS) return false;
  if (nowSeconds - issuedAtSeconds > OWNER_SESSION_MAX_AGE_SECONDS) return false;

  return secureSecretMatches(signature, signIssuedAt(secret, issuedAtSeconds), SIGNATURE_LENGTH);
}
