export function averageReadiness(readiness: Record<string, number>): number {
  const v = Object.values(readiness);
  if (!v.length) return 0;
  return Math.round(v.reduce((a, b) => a + b, 0) / v.length);
}
