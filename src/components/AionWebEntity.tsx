import type { CSSProperties } from "react";

/** Пульс ядра экосистемы AION на вебе: визуализация агрегированной готовности платформы (0–100). */
export function AionWebEntity({ readinessAvg }: { readinessAvg: number }) {
  const ms = Math.round(3200 - Math.min(2200, readinessAvg * 22));
  return (
    <div
      className="aion-entity relative mx-auto flex h-40 w-40 items-center justify-center md:h-48 md:w-48"
      style={{ "--aion-pulse": `${ms}ms` } as CSSProperties}
      role="img"
      aria-label="Ядро экосистемы AION: агрегированная готовность платформы"
    >
      <div className="aion-entity-halo absolute inset-0 rounded-full bg-cyan-500/25 blur-2xl" />
      <div className="aion-entity-core relative flex h-[72%] w-[72%] items-center justify-center rounded-full bg-gradient-to-br from-cyan-600/90 via-violet-700/80 to-slate-900 shadow-[0_0_40px_rgba(34,211,238,0.35)] ring-1 ring-cyan-400/40">
        <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-white/90">Ядро</span>
      </div>
    </div>
  );
}
