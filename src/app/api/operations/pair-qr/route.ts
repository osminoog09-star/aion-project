import { NextResponse } from "next/server";
import { pairCodeToQrPayload } from "@/lib/operations/pair-qr-payload";

export const runtime = "edge";

/** PNG QR для экрана «Выпустить код» (сканируется вторым телефоном). */
export async function GET(req: Request) {
  const code = new URL(req.url).searchParams.get("code")?.trim().toUpperCase();
  if (!code || !/^[A-Z0-9]{4,8}$/.test(code)) {
    return NextResponse.json({ error: "invalid code" }, { status: 400 });
  }
  const data = pairCodeToQrPayload(code);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(data)}`;
  return NextResponse.redirect(qrUrl, 302);
}
