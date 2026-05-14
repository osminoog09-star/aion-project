import type {
  EcosystemStatus,
  EcosystemSubsystem,
  OperationsHealthRow,
  ReleasePhase,
  RoadmapMilestone,
  SubsystemStatus,
  TechnicalDebtItem,
} from "@/lib/ecosystem-types";
import { subsystemStatusLabel, subsystemStatusTone } from "@/lib/roadmap-labels";

function badgeToneClasses(tone: ReturnType<typeof subsystemStatusTone>): string {
  switch (tone) {
    case "emerald":
      return "border-emerald-500/35 bg-emerald-500/10 text-emerald-200";
    case "amber":
      return "border-amber-500/35 bg-amber-500/10 text-amber-100";
    case "rose":
      return "border-rose-500/35 bg-rose-500/10 text-rose-100";
    case "violet":
      return "border-violet-500/35 bg-violet-500/10 text-violet-100";
    case "slate":
      return "border-white/10 bg-white/[0.04] text-slate-400";
    default:
      return "border-cyan-500/35 bg-cyan-500/10 text-cyan-100";
  }
}

export function StatusBadge({ status }: { status: SubsystemStatus }) {
  const tone = subsystemStatusTone(status);
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badgeToneClasses(tone)}`}
    >
      {subsystemStatusLabel(status)}
    </span>
  );
}

export function ReadinessBar({ value }: { value: number }) {
  const v = Math.min(100, Math.max(0, value));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
      <div
        className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 transition-[width]"
        style={{ width: `${v}%` }}
      />
    </div>
  );
}

const readinessRu: Record<string, string> = {
  mobile: "Mobile",
  desktop: "Desktop",
  webPortal: "Web портал",
  ocr: "OCR",
  cloud: "Cloud",
  updates: "Обновления",
  aionEntity: "Entity",
  aionLink: "AION Link",
  performance: "Производительность",
  sync: "Синхронизация",
  realtime: "Realtime",
  releaseOps: "Релизные операции",
  offline: "Офлайн",
};

function readinessLabel(key: string): string {
  return readinessRu[key] ?? key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
}

export function ReadinessPillarGrid({ readiness }: { readiness: Record<string, number> }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Object.entries(readiness).map(([key, value]) => (
        <div key={key} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{readinessLabel(key)}</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-white">{value}%</p>
          <div className="mt-3">
            <ReadinessBar value={value} />
          </div>
        </div>
      ))}
    </div>
  );
}

function releaseReadinessRu(r: EcosystemSubsystem["releaseReadiness"]): string {
  switch (r) {
    case "production_candidate":
      return "Кандидат в prod";
    case "preview":
      return "Preview";
    case "not_ready":
    default:
      return "Не релиз";
  }
}

export function SubsystemAuditTable({ subsystems }: { subsystems: EcosystemSubsystem[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10">
      <table className="w-full min-w-[880px] text-left text-sm">
        <thead className="border-b border-white/10 bg-white/[0.03] text-[10px] uppercase tracking-wider text-slate-500">
          <tr>
            <th className="px-4 py-3">Подсистема</th>
            <th className="px-4 py-3">%</th>
            <th className="px-4 py-3">Статус</th>
            <th className="px-4 py-3">Релиз</th>
            <th className="px-4 py-3">M / W / B</th>
            <th className="px-4 py-3">Фаза / веха</th>
            <th className="px-4 py-3">Блокеры</th>
            <th className="px-4 py-3 min-w-[200px]">Суть</th>
          </tr>
        </thead>
        <tbody>
          {subsystems.map((s) => (
            <tr key={s.id} className="border-b border-white/5 align-top hover:bg-white/[0.02]">
              <td className="px-4 py-3">
                <div className="font-medium text-slate-200">{s.name}</div>
                {s.percentBasis ? <p className="mt-1 text-[10px] text-slate-600">{s.percentBasis}</p> : null}
              </td>
              <td className="px-4 py-3 tabular-nums text-cyan-300">{s.percent}</td>
              <td className="px-4 py-3">
                <StatusBadge status={s.status} />
              </td>
              <td className="px-4 py-3 text-xs text-slate-500">
                {s.releaseReadiness ? releaseReadinessRu(s.releaseReadiness) : "—"}
              </td>
              <td className="px-4 py-3 text-[10px] text-slate-500">
                {s.platforms ? (
                  <div className="space-y-1 font-mono">
                    <div>M:{s.platforms.mobile?.percent ?? "—"}</div>
                    <div>W:{s.platforms.web?.percent ?? "—"}</div>
                    <div>B:{s.platforms.backend?.percent ?? "—"}</div>
                  </div>
                ) : (
                  "—"
                )}
              </td>
              <td className="px-4 py-3 text-xs text-slate-400">
                {s.currentPhase ? <p>{s.currentPhase}</p> : null}
                {s.nextMilestone ? <p className="mt-1 text-slate-500">→ {s.nextMilestone}</p> : null}
                {s.priority ? <p className="mt-1 text-[10px] text-slate-600">{s.priority}</p> : null}
              </td>
              <td className="px-4 py-3 text-xs text-rose-200/90">
                {s.blockers?.length ? (
                  <ul className="list-inside list-disc space-y-1">
                    {s.blockers.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                ) : (
                  "—"
                )}
              </td>
              <td className="px-4 py-3 text-xs text-slate-500">{s.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function OperationsDashboard({ rows }: { rows: OperationsHealthRow[] }) {
  if (!rows.length) {
    return <p className="text-sm text-slate-500">Нет блока operations в снимке — проверьте JSON или Supabase payload.</p>;
  }
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {rows.map((r) => (
        <div key={r.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-white">{r.label}</p>
            <StatusBadge status={r.status} />
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums text-cyan-200">{r.percent}%</p>
          <div className="mt-2">
            <ReadinessBar value={r.percent} />
          </div>
          <p className="mt-3 text-xs leading-relaxed text-slate-400">{r.summary}</p>
          {r.lastSignal ? <p className="mt-2 text-[10px] text-slate-600">Сигнал: {r.lastSignal}</p> : null}
        </div>
      ))}
    </div>
  );
}

const severityRing: Record<TechnicalDebtItem["severity"], string> = {
  low: "border-slate-500/30",
  medium: "border-amber-500/30",
  high: "border-orange-500/35",
  critical: "border-rose-500/40",
};

export function TechnicalDebtBoard({ items }: { items: TechnicalDebtItem[] }) {
  if (!items.length) {
    return <p className="text-sm text-slate-500">Техдолг не заведён в JSON.</p>;
  }
  return (
    <ul className="space-y-3">
      {items.map((t) => (
        <li
          key={t.id}
          className={`rounded-xl border bg-white/[0.02] px-4 py-3 ${severityRing[t.severity]}`}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{t.severity}</span>
            {t.subsystemId ? (
              <span className="rounded bg-white/5 px-2 py-0.5 font-mono text-[10px] text-slate-400">{t.subsystemId}</span>
            ) : null}
          </div>
          <p className="mt-1 text-sm font-medium text-slate-200">{t.title}</p>
          <p className="mt-2 text-xs text-slate-500">{t.evidence}</p>
        </li>
      ))}
    </ul>
  );
}

function phaseStyle(phase: ReleasePhase["status"]): string {
  switch (phase) {
    case "past":
      return "border-slate-600/40 text-slate-400";
    case "active":
      return "border-cyan-500/40 text-cyan-100";
    default:
      return "border-violet-500/35 text-violet-100";
  }
}

export function ReleasePhaseStrip({ phases }: { phases: ReleasePhase[] }) {
  if (!phases.length) return null;
  return (
    <div className="flex flex-col gap-4 md:flex-row md:flex-wrap">
      {phases.map((p) => (
        <div
          key={p.id}
          className={`min-w-[220px] flex-1 rounded-xl border bg-white/[0.02] px-4 py-3 ${phaseStyle(p.status)}`}
        >
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">{p.status}</p>
          <p className="mt-1 text-sm font-semibold text-white">{p.name}</p>
          {p.window ? <p className="mt-1 text-xs text-slate-500">{p.window}</p> : null}
          <p className="mt-2 text-xs text-slate-400">{p.description}</p>
        </div>
      ))}
    </div>
  );
}

function milestoneDot(status: RoadmapMilestone["status"]): string {
  switch (status) {
    case "done":
      return "bg-emerald-400";
    case "in_progress":
      return "bg-cyan-400";
    case "blocked":
      return "bg-rose-500";
    default:
      return "bg-slate-600";
  }
}

export function MilestoneTimeline({ milestones }: { milestones: RoadmapMilestone[] }) {
  if (!milestones.length) return null;
  return (
    <ol className="relative border-l border-white/10 pl-6">
      {milestones.map((m) => (
        <li key={m.id} className="mb-8 ml-1">
          <span className={`absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full ${milestoneDot(m.status)}`} />
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{m.status}</p>
          <p className="text-sm font-semibold text-white">{m.title}</p>
          {m.target ? <p className="text-xs text-slate-500">{m.target}</p> : null}
          {m.note ? <p className="mt-2 text-xs text-slate-400">{m.note}</p> : null}
          <p className="mt-1 text-[10px] text-slate-600">{m.subsystemIds.join(" · ")}</p>
        </li>
      ))}
    </ol>
  );
}

export function DefinitionOfDoneCallout({ lines }: { lines: string[] }) {
  if (!lines.length) return null;
  return (
    <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-6">
      <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-300/90">Правила «Fully Done»</h3>
      <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-slate-300">
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </div>
  );
}

export function EcosystemSummaryHeader({ eco }: { eco: EcosystemStatus }) {
  return (
    <header className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-cyan-400/90">Live roadmap · audit</p>
      <p className="text-xs text-slate-600">
        Обновлено: <time dateTime={eco.lastUpdated}>{eco.lastUpdated}</time>
        {eco.maintainedInRepository ? " · источник: репозиторий (+ опционально Supabase snapshot)" : null}
      </p>
    </header>
  );
}
