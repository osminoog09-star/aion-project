import { NextResponse } from "next/server";
import {
  isOwnerAuthConfigured,
  setOwnerSessionCookie,
  verifyOwnerPassword,
} from "@/lib/operations/owner-auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!isOwnerAuthConfigured()) {
    return NextResponse.json(
      { ok: false, error: "OPERATIONS_OWNER_SECRET not configured on server." },
      { status: 503 },
    );
  }
  let body: { password?: string };
  try {
    body = (await req.json()) as { password?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  const password = body.password ?? "";
  if (!verifyOwnerPassword(password)) {
    return NextResponse.json({ ok: false, error: "Invalid credentials" }, { status: 401 });
  }
  const ok = await setOwnerSessionCookie();
  if (!ok) {
    return NextResponse.json({ ok: false, error: "Could not set session" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
