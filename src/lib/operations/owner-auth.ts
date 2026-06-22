import { createHmac } from "node:crypto";
import { cookies } from "next/headers";
import { secureSecretMatches } from "@/lib/operations/secure-secret";

export const OWNER_COOKIE = "aion_ops_owner";

function getOwnerSecret(): string | null {
  const s = process.env.OPERATIONS_OWNER_SECRET?.trim();
  return s && s.length >= 16 ? s : null;
}

function signToken(secret: string): string {
  return createHmac("sha256", secret).update("aion-owner-v1").digest("hex");
}

export function isOwnerAuthConfigured(): boolean {
  return Boolean(getOwnerSecret());
}

export function verifyOwnerPassword(password: string): boolean {
  const secret = getOwnerSecret();
  return secureSecretMatches(password, secret);
}

export function buildOwnerCookieValue(): string | null {
  const secret = getOwnerSecret();
  if (!secret) return null;
  return signToken(secret);
}

export function verifyOwnerCookieValue(value: string | undefined): boolean {
  const secret = getOwnerSecret();
  if (!secret || !value) return false;
  const expected = signToken(secret);
  return secureSecretMatches(value, expected, 64);
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
    maxAge: 60 * 60 * 24 * 7,
  });
  return true;
}

export async function clearOwnerSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(OWNER_COOKIE);
}
