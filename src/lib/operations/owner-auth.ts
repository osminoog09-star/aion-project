import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

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
  if (!secret) return false;
  const a = Buffer.from(password);
  const b = Buffer.from(secret);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
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
  try {
    const a = Buffer.from(value);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
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
