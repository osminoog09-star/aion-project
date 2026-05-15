import Link from "next/link";
import type { ImplementationFeedItem } from "@/lib/ecosystem-types";
import {
  buildExecutionAuditView,
  confidenceBadgeClass,
  validationSummary,
  type ExecutionAuditView,
} from "@/lib/execution-audit";
import { ecosystemRoutes } from "@/lib/ecosystem-routes";

export function OperationsSubNav() {
  const links = [
    { href: ecosystemRoutes.operations, label: "Overview" },
    { href: ecosystemRoutes.operationsExecution, label: "Execution" },
    { href: ecosystemRoutes.operationsTimeline, label: "Timeline" },
    { href: ecosystemRoutes.operationsBlockers, label: "Blockers" },
    { href: ecosystemRoutes.operationsRuntime, label: "Runtime" },
    { href: ecosystemRoutes.operationsValidation, label: "Validation" },
    { href: ecosystemRoutes.operationsPriorities, label: "Priorities" },
    { href: ecosystemRoutes.operationsReviewQueue, label: "Review queue" },
    { href: ecosystemRoutes.operationsReviews, label: "Reviews" },
    { href: ecosystemRoutes.operationsDeployment, label: "Deploy" },
    { href: ecosystemRoutes.operationsContext, label: "Context" },
    { href: ecosystemRoutes.roadmapExecution, label: "Queue" },
  ];
  return (
    <nav className="mt-4 flex flex-wrap gap-2 text-xs">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-slate-300 hover:border-cyan-500/40 hover:text-cyan-200"
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}

export function NextActionPanel({ view }: { view: ExecutionAuditView }) {
  return (
    <section className="rounded-2xl border border-cyan-500/25 bg-cyan-500/5 p-5">
      <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-400/90">Следующий шаг (roadmap)</h2>
      <p className="mt-2 text-sm text-slate-200">{view.nextTarget}</p>
      {view.plannedNext.length ? (
        <ul className="mt-3 space-y-1 text-xs text-slate-400">
          {view.plannedNext.map((p) => (
            <li key={p}>· {p}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

export function ConfidenceGrid({ view }: { view: ExecutionAuditView }) {
  return (
    <section className="mt-10">
      <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">Уверенность по подсистемам</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {view.subsystemConfidence.map((row) => (
          <div key={row.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold text-white">{row.name}</span>
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${confidenceBadgeClass(row.confidence)}`}
              >
                {row.confidence}
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {row.percent}% · {String(row.status).replace(/_/g, " ")}
            </p>
            {row.nextStep ? <p className="mt-2 text-[11px] text-cyan-200/80">→ {row.nextStep}</p> : null}
          </div>
        ))}
      </div>
    </section>
  );
}

export function RiskBoard({ view }: { view: ExecutionAuditView }) {
  if (!view.riskAreas.length) {
    return <p className="mt-4 text-sm text-slate-500">Нет зафиксированных зон повышенного риска в JSON.</p>;
  }
  return (
    <ul className="mt-4 space-y-3">
      {view.riskAreas.map((r) => (
        <li
          key={r.id}
          className={`rounded-xl border px-4 py-3 text-sm ${
            r.severity === "critical"
              ? "border-rose-500/40 bg-rose-500/10"
              : r.severity === "high"
                ? "border-amber-500/40 bg-amber-500/10"
                : "border-white/10 bg-white/[0.02]"
          }`}
        >
          <div className="flex flex-wrap justify-between gap-2">
            <span className="font-semibold text-white">{r.label}</span>
            <span className="text-[10px] uppercase tracking-wider text-slate-500">{r.severity}</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">{r.detail}</p>
        </li>
      ))}
    </ul>
  );
}

export function BlockersList({ view }: { view: ExecutionAuditView }) {
  const unique = [...new Set(view.blockedTasks)];
  if (!unique.length) {
    return <p className="text-sm text-slate-500">Нет открытых блокеров в execution queue / ecosystem-status.</p>;
  }
  return (
    <ul className="mt-4 space-y-2">
      {unique.map((b) => (
        <li key={b} className="rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-2 text-sm text-rose-100/90">
          {b}
        </li>
      ))}
    </ul>
  );
}

export function AuditFeedCard({ ev }: { ev: ImplementationFeedItem }) {
  return (
    <li className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-lg font-semibold text-white">{ev.title}</h3>
        <span className="font-mono text-xs text-slate-500">{ev.occurredAt}</span>
      </div>
      {ev.eventType ? (
        <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-violet-300/90">{ev.eventType}</p>
      ) : null}
      <p className="mt-2 text-sm text-slate-400">{ev.summary}</p>
      {ev.reasoning ? (
        <div className="mt-3 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-3 py-2">
          <p className="text-[10px] font-bold uppercase text-cyan-400/80">Почему</p>
          <p className="mt-1 text-xs text-slate-300">{ev.reasoning}</p>
        </div>
      ) : null}
      {ev.changedFiles?.length ? (
        <p className="mt-2 text-xs text-slate-500">
          Файлы: <span className="font-mono text-slate-400">{ev.changedFiles.join(", ")}</span>
        </p>
      ) : null}
      {ev.runtimeImpact || ev.apkImpact ? (
        <p className="mt-2 text-xs text-slate-500">
          Runtime: {ev.runtimeImpact ?? "—"} · APK: {ev.apkImpact ?? "—"}
        </p>
      ) : null}
      {ev.confidence ? (
        <span
          className={`mt-2 inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${confidenceBadgeClass(ev.confidence)}`}
        >
          confidence {ev.confidence}
        </span>
      ) : null}
      {ev.architectureReview ? (
        <div className="mt-3 rounded-lg border border-violet-500/25 bg-violet-500/5 px-3 py-2 text-xs">
          <p className="font-bold uppercase text-violet-300/90">Architecture review</p>
          <p className="mt-1 text-slate-400">{ev.architectureReview.topic}</p>
          <p className="mt-1 text-slate-500">{ev.architectureReview.summary ?? ev.architectureReview.requestReason}</p>
        </div>
      ) : null}
      <p className="mt-2 text-xs text-slate-500">
        Подсистемы: <span className="font-mono">{ev.subsystemIds.join(", ")}</span>
        {ev.repository ? (
          <>
            {" "}
            · <span className="font-mono">{ev.repository}</span>
          </>
        ) : null}
        {ev.commitHash ? (
          <>
            {" "}
            · commit <span className="font-mono">{ev.commitHash}</span>
          </>
        ) : null}
      </p>
      <div className="mt-4 grid gap-3 text-xs md:grid-cols-2">
        <div>
          <p className="font-bold uppercase tracking-wider text-slate-500">Rollup</p>
          <ul className="mt-1 space-y-1 text-slate-400">
            {[...ev.rollup.fullyDone, ...ev.rollup.partiallyDone, ...ev.rollup.notStarted, ...ev.rollup.technicalDebt].map(
              (line) => (
                <li key={line}>{line}</li>
              ),
            )}
          </ul>
        </div>
        <div>
          <p className="font-bold uppercase tracking-wider text-slate-500">Пробелы / блок</p>
          <p className="mt-1 text-slate-400">{ev.stillMissing.join(" · ") || "—"}</p>
          <p className="mt-2 text-rose-200/80">{ev.blocked.join(" · ") || "—"}</p>
        </div>
      </div>
      <p className="mt-3 text-[10px] uppercase tracking-wider text-slate-600">
        validation:{" "}
        <span className="font-mono normal-case text-slate-400">
          {Object.entries(ev.validation)
            .map(([k, v]) => `${k}=${v}`)
            .join(", ") || "—"}
        </span>
      </p>
    </li>
  );
}

export function ValidationDashboard({ view }: { view: ExecutionAuditView }) {
  const sum = validationSummary(view.feed.validationMatrix);
  return (
    <>
      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        {[
          { k: "passed", v: sum.passed, c: "text-emerald-300" },
          { k: "failed", v: sum.failed, c: "text-rose-300" },
          { k: "pending", v: sum.pending, c: "text-amber-300" },
          { k: "unknown", v: sum.unknown, c: "text-slate-400" },
        ].map((x) => (
          <div key={x.k} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center">
            <p className={`text-2xl font-bold ${x.c}`}>{x.v}</p>
            <p className="text-[10px] uppercase text-slate-500">{x.k}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-[10px] uppercase text-slate-500">
              <th className="py-2 pr-4">Сигнал</th>
              <th className="py-2 pr-4">Статус</th>
              <th className="py-2 pr-4">Дата</th>
              <th className="py-2">Доказательство</th>
            </tr>
          </thead>
          <tbody>
            {view.feed.validationMatrix.map((r) => (
              <tr key={r.id} className="border-b border-white/5 text-slate-300">
                <td className="py-2 pr-4 font-mono text-xs text-cyan-200/90">{r.id}</td>
                <td className="py-2 pr-4">{r.lastKnown}</td>
                <td className="py-2 pr-4 text-xs text-slate-500">{r.lastSignalAt ?? "—"}</td>
                <td className="py-2 text-xs text-slate-500">{r.evidence ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export async function loadExecutionAuditView() {
  const { getEcosystemStatus, getLocalImplementationFeed } = await import("@/lib/ecosystem-data");
  const [feed, eco] = await Promise.all([Promise.resolve(getLocalImplementationFeed()), getEcosystemStatus()]);
  return await buildExecutionAuditView(feed, eco);
}
