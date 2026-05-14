export function averageReadiness(readiness: Record<string, number>): number {
  const v = Object.values(readiness);
  if (!v.length) return 0;
  return Math.round(v.reduce((a, b) => a + b, 0) / v.length);
}

/** Mean of subsystem.percent — editorial numbers from JSON, not auto-inferred. */
export function averageSubsystemPercent(subsystems: { percent: number }[]): number {
  if (!subsystems.length) return 0;
  return Math.round(subsystems.reduce((a, s) => a + s.percent, 0) / subsystems.length);
}
