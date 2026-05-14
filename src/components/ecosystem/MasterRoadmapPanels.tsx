import Link from "next/link";
import type {
  EcosystemStatus,
  EcosystemSubsystem,
  ExecutionPriorities,
  VisionSection,
} from "@/lib/ecosystem-types";
import {
  ReadinessBar,
  StatusBadge,
} from "@/components/ecosystem/EcosystemAuditViews";
import { ecosystemRoutes } from "@/lib/ecosystem-routes";

function otaImpactRu(v: EcosystemSubsystem["otaImpact"]): string {
  switch (v) {
    case "high":
      return "OTA: высокое влияние";
    case "medium":
      return "OTA: среднее";
    case "low":
      return "OTA: низкое";
    case "none":
      return "OTA: нет";
    default:
      return "OTA: —";
  }
}

function MiniSlice({ label, value }: { label: string; value?: number }) {
  if (value == null) return null;
  return (
    <div className="mt-2">
      <div className="flex justify-between text-[9px] uppercase tracking-wider text-slate-600">
        <span>{label}</span>
        <span className="tabular-nums text-slate-500">{value}%</span>
      </div>
      <ReadinessBar value={value} />
    </div>
  );
}

export function SubsystemMasterCard({ s }: { s: EcosystemSubsystem }) {
  const hasProfile =
    (s.whatWorks?.length ?? 0) > 0 ||
    (s.whatDoesNotWork?.length ?? 0) > 0 ||
    (s.mocked?.length ?? 0) > 0 ||
    (s.localOnly?.length ?? 0) > 0;

  return (
    <div className="flex flex-col rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-100">{s.name}</h3>
        <StatusBadge status={s.status} />
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums text-cyan-200">{s.percent}%</p>
      <div className="mt-2">
        <ReadinessBar value={s.percent} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-slate-500">
        {s.releaseReadiness ? <span className="rounded bg-white/5 px-2 py-0.5">Релиз: {s.releaseReadiness}</span> : null}
        {s.otaImpact ? <span className="rounded bg-white/5 px-2 py-0.5">{otaImpactRu(s.otaImpact)}</span> : null}
        {s.priority ? <span className="rounded bg-violet-500/10 px-2 py-0.5 text-violet-200">{s.priority}</span> : null}
      </div>
      <MiniSlice label="Realtime" value={s.realtimeReadiness} />
      <MiniSlice label="Backend" value={s.backendReadiness} />
      <MiniSlice label="Production" value={s.productionReadiness} />
      <p className="mt-3 text-xs leading-relaxed text-slate-500">{s.note}</p>
      {s.nextMilestone ? <p className="mt-2 text-[11px] text-cyan-500/80">→ {s.nextMilestone}</p> : null}
      {s.blockers?.length ? (
        <p className="mt-2 text-[11px] text-rose-300/90">Блокеры: {s.blockers.join(" · ")}</p>
      ) : null}
      {hasProfile ? (
        <details className="mt-3 border-t border-white/5 pt-3">
          <summary className="cursor-pointer text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Профиль исполнения
          </summary>
          <div className="mt-2 space-y-2 text-[11px] text-slate-400">
            {s.whatWorks?.length ? (
              <div>
                <p className="font-semibold text-emerald-400/90">Работает</p>
                <ul className="mt-1 list-inside list-disc">
                  {s.whatWorks.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {s.whatDoesNotWork?.length ? (
              <div>
                <p className="font-semibold text-amber-400/90">Не работает / дыры</p>
                <ul className="mt-1 list-inside list-disc">
                  {s.whatDoesNotWork.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {s.mocked?.length ? (
              <div>
                <p className="font-semibold text-slate-500">Mock</p>
                <ul className="mt-1 list-inside list-disc">{s.mocked.map((x) => (
                  <li key={x}>{x}</li>
                ))}</ul>
              </div>
            ) : null}
            {s.localOnly?.length ? (
              <div>
                <p className="font-semibold text-slate-500">Только локально</p>
                <ul className="mt-1 list-inside list-disc">{s.localOnly.map((x) => (
                  <li key={x}>{x}</li>
                ))}</ul>
              </div>
            ) : null}
            {s.cloudReady?.length ? (
              <div>
                <p className="font-semibold text-cyan-400/80">Cloud-ready</p>
                <ul className="mt-1 list-inside list-disc">{s.cloudReady.map((x) => (
                  <li key={x}>{x}</li>
                ))}</ul>
              </div>
            ) : null}
            {s.requiresApk?.length ? (
              <div>
                <p className="font-semibold text-violet-300/90">Нужен APK</p>
                <ul className="mt-1 list-inside list-disc">{s.requiresApk.map((x) => (
                  <li key={x}>{x}</li>
                ))}</ul>
              </div>
            ) : null}
            {s.otaSafe?.length ? (
              <div>
                <p className="font-semibold text-slate-400">OTA-safe</p>
                <ul className="mt-1 list-inside list-disc">{s.otaSafe.map((x) => (
                  <li key={x}>{x}</li>
                ))}</ul>
              </div>
            ) : null}
            {s.subsystemDebt?.length ? (
              <div>
                <p className="font-semibold text-rose-300/80">Долг подсистемы</p>
                <ul className="mt-1 list-inside list-disc">{s.subsystemDebt.map((x) => (
                  <li key={x}>{x}</li>
                ))}</ul>
              </div>
            ) : null}
          </div>
        </details>
      ) : null}
    </div>
  );
}

export function VisionPanel({ vision }: { vision: VisionSection }) {
  return (
    <section className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-violet-500/10 p-6 md:p-8">
      <h2 className="text-sm font-bold uppercase tracking-widest text-cyan-300/90">{vision.title}</h2>
      <div className="mt-4 space-y-4 text-sm leading-relaxed text-slate-300">
        {vision.paragraphs.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
    </section>
  );
}

export function ExecutionPanel({ ex }: { ex: ExecutionPriorities }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
      <h2 className="text-sm font-bold uppercase tracking-widest text-violet-400/90">Исполнение</h2>
      <div className="mt-4 grid gap-6 md:grid-cols-2">
        <div>
          <p className="text-[10px] font-bold uppercase text-slate-500">Текущий фокус</p>
          <p className="mt-1 text-sm text-slate-200">{ex.currentPriority}</p>
          <p className="mt-4 text-[10px] font-bold uppercase text-slate-500">Следующий</p>
          <p className="mt-1 text-sm text-slate-400">{ex.nextPriority}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase text-slate-500">Фазы</p>
          <p className="mt-1 text-xs text-slate-400">Инфра: {ex.infrastructurePhase}</p>
          <p className="mt-2 text-xs text-slate-400">Frontend: {ex.frontendPhase}</p>
          <p className="mt-2 text-xs text-slate-400">Cloud: {ex.cloudPhase}</p>
        </div>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-[10px] font-bold uppercase text-rose-300/80">Заблокировано</p>
          <ul className="mt-2 list-inside list-disc text-xs text-rose-200/90">
            {ex.blockedTasks.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase text-emerald-400/80">Активные эпики</p>
          <ul className="mt-2 list-inside list-disc text-xs text-slate-400">
            {ex.activeEpics.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function CloudSoTPanel({ eco }: { eco: EcosystemStatus }) {
  const c = eco.cloudSoT;
  if (!c) return null;
  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Источник правды (cloud)</h3>
      <p className="mt-2 text-sm text-slate-300">
        Primary: <span className="font-mono text-cyan-300/90">{c.primary}</span>
      </p>
      <p className="mt-2 text-xs text-slate-500">{c.note}</p>
      <p className="mt-3 text-[10px] text-slate-600">
        Snapshot kinds: <span className="font-mono">{c.snapshotKinds.join(", ")}</span>
      </p>
    </section>
  );
}

export function CursorRulesPanel({ rules }: { rules: string[] }) {
  if (!rules.length) return null;
  return (
    <section className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-6">
      <h2 className="text-xs font-bold uppercase tracking-widest text-amber-200/90">Правила для Cursor / агентов</h2>
      <ul className="mt-3 list-inside list-decimal space-y-2 text-sm text-slate-300">
        {rules.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
    </section>
  );
}

export function ReleaseQualityPanel({ lines }: { lines: string[] }) {
  if (!lines.length) return null;
  return (
    <div className="rounded-2xl border border-violet-500/25 bg-violet-500/5 p-6">
      <h3 className="text-xs font-bold uppercase tracking-widest text-violet-200/90">Планка «реально done»</h3>
      <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-slate-300">
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </div>
  );
}

export function RoadmapHubLinks() {
  return (
    <p className="flex flex-wrap gap-3 text-xs text-slate-500">
      <Link href={ecosystemRoutes.control} className="text-cyan-400 hover:underline">
        /control
      </Link>
      <Link href={ecosystemRoutes.ecosystem} className="text-cyan-400 hover:underline">
        /ecosystem
      </Link>
      <Link href={ecosystemRoutes.operations} className="text-cyan-400 hover:underline">
        /operations
      </Link>
      <Link href={ecosystemRoutes.operationsContext} className="text-cyan-400 hover:underline">
        /operations/context
      </Link>
      <Link href={ecosystemRoutes.roadmapExecution} className="text-cyan-400 hover:underline">
        /roadmap/execution
      </Link>
      <Link href={ecosystemRoutes.status} className="text-cyan-400 hover:underline">
        /status
      </Link>
      <Link href={ecosystemRoutes.roadmap} className="text-cyan-400 hover:underline">
        /roadmap
      </Link>
    </p>
  );
}
