import { priorityLevelLabel, priorityStatusLabel, t } from "@/i18n";
import type { ExecutionDependencyNode, StrategicPrioritiesPayload, StrategicPriorityItem } from "@/lib/ecosystem-types";
import {
  getActionableDependencies,
  getBlockedDependencies,
  priorityLevelBadgeClass,
  sortPriorities,
} from "@/lib/strategic-priorities";

export function OwnerDirectivePanel({ payload }: { payload: StrategicPrioritiesPayload }) {
  return (
    <section className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
      <h2 className="text-xs font-bold uppercase tracking-widest text-amber-300/90">{t("common.ownerDirective")}</h2>
      <p className="mt-2 text-sm text-slate-200">{payload.ownerDirective}</p>
      <p className="mt-3 text-xs text-slate-500">
        Constitution v{payload.constitutionVersion} · обновлено {payload.lastUpdated}
      </p>
      <p className="mt-2 text-xs text-slate-600">{payload.editPolicy}</p>
    </section>
  );
}

export function PriorityBoard({ items }: { items: StrategicPriorityItem[] }) {
  const sorted = sortPriorities(items);
  return (
    <ul className="mt-4 space-y-3">
      {sorted.map((p) => (
        <li key={p.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold text-white">{p.title}</span>
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${priorityLevelBadgeClass(p.level)}`}
            >
              {priorityLevelLabel(p.level)}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-400">{p.rationale}</p>
          <p className="mt-2 text-sm text-cyan-200/90">→ {p.nextAction}</p>
          <p className="mt-2 font-mono text-[10px] text-slate-600">
            {p.id} · {p.status} · {p.subsystemIds.join(", ")} · {p.setBy} @ {p.setAt}
          </p>
        </li>
      ))}
    </ul>
  );
}

export function DependencyGraphBoard({
  graph,
  priorities,
}: {
  graph: ExecutionDependencyNode[];
  priorities: StrategicPriorityItem[];
}) {
  const blocked = getBlockedDependencies(graph);
  const actionable = getActionableDependencies(graph, priorities);

  return (
    <div className="mt-6 space-y-6">
      {actionable.length > 0 ? (
        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-emerald-400/80">
            {t("operations.pages.priorities.readyToExecute")}
          </h3>
          <ul className="mt-2 space-y-2">
            {actionable.map((n) => (
              <DependencyRow key={n.id} node={n} tone="ready" />
            ))}
          </ul>
        </div>
      ) : null}
      <div>
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{t("common.dependencyGraph")}</h3>
        <ul className="mt-2 space-y-2">
          {graph.map((n) => (
            <DependencyRow key={n.id} node={n} tone={n.status === "blocked" ? "blocked" : "default"} />
          ))}
        </ul>
      </div>
      {blocked.length > 0 ? (
        <p className="text-xs text-slate-500">
          {t("operations.pages.priorities.blockedNodes", { count: blocked.length })}
        </p>
      ) : null}
    </div>
  );
}

function DependencyRow({
  node,
  tone,
}: {
  node: ExecutionDependencyNode;
  tone: "ready" | "blocked" | "default";
}) {
  const border =
    tone === "ready"
      ? "border-emerald-500/30 bg-emerald-500/5"
      : tone === "blocked"
        ? "border-rose-500/25 bg-rose-500/5"
        : "border-white/10 bg-white/[0.02]";
  return (
    <li className={`rounded-lg border px-3 py-2 text-xs ${border}`}>
      <p className="font-semibold text-white">{node.title}</p>
      <p className="mt-1 text-slate-500">
        {t("common.depends")}: <span className="font-mono text-slate-400">{node.dependsOn.join(" → ")}</span>
      </p>
      <p className="mt-1 text-slate-400">{node.reason}</p>
      <p className="mt-1 font-mono text-[10px] uppercase text-slate-600">{priorityStatusLabel(node.status)}</p>
    </li>
  );
}

export function CursorAdaptationRules({ rules }: { rules: string[] }) {
  return (
    <ul className="mt-3 space-y-1 text-xs text-slate-400">
      {rules.map((r) => (
        <li key={r}>· {r}</li>
      ))}
    </ul>
  );
}
