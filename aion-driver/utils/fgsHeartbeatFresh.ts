export const FGS_HEARTBEAT_FRESH_MS = 5 * 60_000;

export function isFgsHeartbeatFresh(
  ageMs: number | null,
  freshMs = FGS_HEARTBEAT_FRESH_MS,
): boolean {
  return ageMs != null && ageMs >= 0 && ageMs < freshMs;
}
