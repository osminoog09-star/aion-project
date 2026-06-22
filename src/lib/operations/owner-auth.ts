import { cookies } from "next/headers";
import { secureSecretMatches } from "@/lib/operations/secure-secret";
import {
  buildOwnerSessionToken,
  OWNER_SESSION_MAX_AGE_SECONDS,
  verifyOwnerSessionToken,
} from "@/lib/operations/owner-session-token";

export const OWNER_COOKIE = "aion_ops_owner";

function getOwnerSecret(): string | null {
  const s = process.env.OPERATIONS_OWNER_SECRET?.trim();
  return s && s.length >= 16 ? s : null;
}

export function isOwnerAuthConfigured(): boolean {
  return Boolean(getOwnerSecret());
}

export function verifyOwnerPassword(password: string): boolean {
  const secret = getOwnerSecret();
  return secureSecretMatches(password, secret);
}

export function buildOwnerCookieValue(nowMs = Date.now()): string | null {
  const secret = getOwnerSecret();
  if (!secret) return null;
  return buildOwnerSessionToken(secret, nowMs);
}

export function verifyOwnerCookieValue(value: string | undefined, nowMs = Date.now()): boolean {
  const secret = getOwnerSecret();
  if (!secret || !value) return false;
  return verifyOwnerSessionToken(value, secret, nowMs);
}

export async function isOwnerAuthenticated(): Promise<boolean> {
  const jar = await cookies();
  return verifyOwnerCookieValue(jar.get(OWNER_COOKIE)?.value);
}

export async function setOwnerSessionCookie(): Promise<boolean> {
  const token = buildOwnerCookieValue();
  if (!token) return false;
  const jar = await cookies();
  jar.set(OWNER_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: OWNER_SESSION_MAX_AGE_SECONDS,
  });
  return true;
}

export async function clearOwnerSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(OWNER_COOKIE);
}
