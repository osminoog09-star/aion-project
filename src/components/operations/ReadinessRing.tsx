export function ReadinessRing({
  percent,
  size = 120,
  label,
}: {
  percent: number;
  size?: number;
  label?: string;
}) {
  const r = (size - 12) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;
  const color =
    percent >= 75 ? "#34d399" : percent >= 45 ? "#22d3ee" : percent >= 20 ? "#a78bfa" : "#64748b";

  return (
    <div className="relative inline-flex flex-col items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold tabular-nums text-white">{percent}%</span>
        {label ? <span className="mt-0.5 text-[9px] uppercase tracking-wider text-slate-500">{label}</span> : null}
      </div>
    </div>
  );
}
