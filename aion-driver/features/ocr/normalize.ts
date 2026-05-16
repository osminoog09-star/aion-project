/**
 * Нормализация текста после OCR / вставки из буфера.
 */
export function normalizeOcrText(raw: string): string {
  let t = raw.replace(/\u00a0/g, " ");
  try {
    t = t.normalize("NFKC");
  } catch {
    /* ignore */
  }
  t = t.replace(/[\uFF10-\uFF19]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xff10 + 0x30));
  t = t.replace(/[\u200b-\u200d\ufeff]/g, "");
  t = t.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  t = t.replace(/[‐‑‒–—―]/g, "-");
  t = t.replace(/\t+/g, " ");
  const lines = t
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  return lines.join("\n");
}
