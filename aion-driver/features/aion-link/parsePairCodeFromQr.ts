/** Из QR/буфера: голый код или JSON `{"aion":"pair","code":"ABC123"}`. */
export function parsePairCodeFromQr(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  try {
    const j = JSON.parse(t) as { aion?: string; code?: string };
    if (j?.aion === "pair" && typeof j.code === "string") {
      return normalizePairCode(j.code);
    }
  } catch {
    /* not json */
  }
  return normalizePairCode(t);
}

function normalizePairCode(s: string): string | null {
  const code = s.replace(/\s+/g, "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (code.length < 4 || code.length > 8) return null;
  return code;
}

export function pairCodeToQrPayload(code: string): string {
  return JSON.stringify({ aion: "pair", code: code.trim().toUpperCase() });
}
