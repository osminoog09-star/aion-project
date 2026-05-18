export function pairCodeToQrPayload(code: string): string {
  return JSON.stringify({ aion: "pair", code: code.trim().toUpperCase() });
}
