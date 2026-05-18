import type {
  AiStrategySectionRu,
  ExecutionDependencyNode,
  InfraComplexity,
  RiskLevel,
  StrategicLongTermDirection,
  StrategicPrioritiesPayload,
} from "@/lib/ecosystem-types";
import { priorityLevelBadgeClass } from "@/lib/strategic-priorities";

type PanelProps = {
  payload: StrategicPrioritiesPayload;
  /** Скрыть внешний заголовок секции (когда родитель уже дал h2). */
  embedded?: boolean;
};

function complexityRu(c: InfraComplexity): string {
  const map: Record<InfraComplexity, string> = {
    low: "инфра: низкая",
    medium: "инфра: средняя",
    high: "инфра: высокая",
    very_high: "инфра: очень высокая",
  };
  return map[c];
}

function riskRu(r: RiskLevel): string {
  const map: Record<RiskLevel, string> = {
    low: "риск: низкий",
    medium: "риск: средний",
    high: "риск: высокий",
  };
  return map[r];
}

function PhaseRow({
  phase,
  index,
}: {
  phase: StrategicLongTermDirection["phases"][number];
  index: number;
}) {
  return (
    <li className="rounded-lg border border-white/8 bg-black/25 px-3 py-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-bold text-fuchsia-300/90">Этап {index + 1}</span>
        <span className="text-sm font-medium text-white">{phase.titleRu}</span>
      </div>
      <p className="mt-1 text-xs text-slate-400">{phase.summaryRu}</p>
      <p className="mt-1.5 flex flex-wrap gap-2 text-[10px] text-slate-500">
        <span>{complexityRu(phase.infraComplexity)}</span>
        <span>{riskRu(phase.riskLevel)}</span>
        {phase.etaWindowRu ? <span>· {phase.etaWindowRu}</span> : null}
      </p>
    </li>
  );
}

function DependencyLinks({
  directionId,
  graph,
}: {
  directionId: string;
  graph: ExecutionDependencyNode[];
}) {
  const prefix = directionId.includes("maps")
    ? "maps-"
    : directionId.includes("fuel")
      ? "fuel-"
      : null;
  const related = graph.filter(
    (n) =>
      n.id === directionId ||
      n.dependsOn.includes(directionId) ||
      (prefix != null && n.id.startsWith(prefix)),
  );
  if (!related.length) return null;
  return (
    <section className="mt-4">
      <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
        Зависимости в графе
      </h4>
      <ul className="mt-2 space-y-1.5 text-xs text-slate-500">
        {related.map((n) => (
          <li key={n.id} className="rounded-md border border-white/8 bg-black/20 px-2 py-1.5">
            <span className="font-medium text-slate-300">{n.title}</span>
            {n.dependsOn.length ? (
              <span className="text-slate-600"> ← {n.dependsOn.join(", ")}</span>
            ) : null}
            <span className="ml-1 text-amber-400/80">· {n.reason}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function DirectionCard({
  direction,
  graph,
}: {
  direction: StrategicLongTermDirection;
  graph: ExecutionDependencyNode[];
}) {
  return (
    <article className="rounded-2xl border border-fuchsia-500/25 bg-gradient-to-br from-fuchsia-950/30 via-slate-950/80 to-cyan-950/20 p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="text-lg font-semibold text-white">{direction.titleRu}</h3>
        <span
          className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase ${priorityLevelBadgeClass("strategic")}`}
        >
          долгосрок · только roadmap
        </span>
      </div>
      <p className="mt-2 text-sm text-fuchsia-200/85">{direction.taglineRu}</p>

      <section className="mt-4 space-y-2">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-amber-300/80">
          Почему это важно
        </h4>
        <p className="text-sm leading-relaxed text-slate-300">{direction.importanceRu}</p>
      </section>

      <section className="mt-4 space-y-2">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-cyan-300/80">
          Связь с Driver Intelligence
        </h4>
        <p className="text-sm leading-relaxed text-slate-300">{direction.driverIntelligenceLinkRu}</p>
      </section>

      <section className="mt-4">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
          Какие проблемы решаем
        </h4>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-400">
          {direction.problemsSolvedRu.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </section>

      <section className="mt-5">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-violet-300/80">
          Этапы направления
        </h4>
        <ol className="mt-3 space-y-2">
          {direction.phases.map((ph, i) => (
            <PhaseRow key={ph.id} phase={ph} index={i} />
          ))}
        </ol>
      </section>

      <div className="mt-4 flex flex-wrap gap-2 text-[10px]">
        <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-slate-400">
          {complexityRu(direction.infraComplexityOverall)}
        </span>
        <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-slate-400">
          {riskRu(direction.riskLevelOverall)}
        </span>
      </div>

      <section className="mt-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-3 py-3">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-cyan-400/90">
          Self-host архитектура (цель)
        </h4>
        <p className="mt-1 text-xs leading-relaxed text-slate-400">{direction.selfHostArchitectureRu}</p>
      </section>

      <section className="mt-4">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-400/80">
          Будущие возможности
        </h4>
        <ul className="mt-2 flex flex-wrap gap-2">
          {direction.futureCapabilitiesRu.map((cap) => (
            <li
              key={cap}
              className="rounded-full border border-emerald-500/25 bg-emerald-500/8 px-2.5 py-1 text-[10px] text-emerald-100/90"
            >
              {cap}
            </li>
          ))}
        </ul>
      </section>

      <DependencyLinks directionId={direction.id} graph={graph} />

      <p className="mt-4 rounded-lg border border-rose-500/25 bg-rose-500/8 px-3 py-2 text-xs text-rose-100/90">
        <span className="font-bold">Сейчас не делаем: </span>
        {direction.notNowRu}
      </p>
    </article>
  );
}

function AiStrategyBlock({ ai }: { ai: AiStrategySectionRu }) {
  return (
    <section className="rounded-2xl border border-violet-500/30 bg-violet-500/5 p-5">
      <h2 className="text-xs font-bold uppercase tracking-widest text-violet-300/90">{ai.title}</h2>
      <p className="mt-3 text-sm font-medium text-amber-100/90">{ai.immediateFocusRu}</p>
      <p className="mt-2 text-sm font-medium text-fuchsia-100/90">{ai.longTermFocusRu}</p>
      <div className="mt-4 space-y-2">
        {ai.paragraphs.map((p) => (
          <p key={p.slice(0, 48)} className="text-sm leading-relaxed text-slate-400">
            {p}
          </p>
        ))}
      </div>
    </section>
  );
}

export function StrategicLongTermPanel({ payload, embedded = false }: PanelProps) {
  const directions = payload.longTermDirections ?? [];
  const graph = payload.dependencyGraph ?? [];
  if (!directions.length && !payload.aiStrategyRu) return null;

  return (
    <div className="space-y-8">
      {payload.aiStrategyRu ? <AiStrategyBlock ai={payload.aiStrategyRu} /> : null}
      <div>
        {!embedded ? (
          <>
            <h2 className="text-xs font-bold uppercase tracking-[0.35em] text-fuchsia-400/90">
              Стратегические направления · long-term
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-500">
              Приоритет экосистемы и architecture direction. Реализация map engine и full fuel engine — не
              в текущем спринте.
            </p>
          </>
        ) : null}
        <div className={embedded ? "space-y-6" : "mt-6 space-y-6"}>
          {directions.map((d) => (
            <DirectionCard key={d.id} direction={d} graph={graph} />
          ))}
        </div>
      </div>
    </div>
  );
}
