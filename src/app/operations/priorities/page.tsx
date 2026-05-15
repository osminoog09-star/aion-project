import type { Metadata } from "next";
import Link from "next/link";
import { OperationsSubNav } from "@/components/operations/ExecutionAuditPanels";
import {
  CursorAdaptationRules,
  DependencyGraphBoard,
  OwnerDirectivePanel,
  PriorityBoard,
} from "@/components/operations/PriorityControlPanels";
import { getLocalStrategicPriorities, buildAutonomousNextTargets } from "@/lib/strategic-priorities";
import { ecosystemRoutes } from "@/lib/ecosystem-routes";

export const metadata: Metadata = {
  title: "Strategic priorities — операции AION",
  description:
    "Приоритеты владельца продукта, dependency graph и правила адаптации автономного Cursor.",
};

export default function OperationsPrioritiesPage() {
  const payload = getLocalStrategicPriorities();
  const autonomousTargets = buildAutonomousNextTargets(payload);

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20">
      <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-amber-400/90">Priority control</p>
      <h1 className="mt-3 text-3xl font-bold text-white md:text-4xl">Strategic priorities</h1>
      <p className="mt-3 max-w-3xl text-sm text-slate-400">
        MASTER Constitution §9: владелец задаёт приоритеты в{" "}
        <code className="font-mono text-cyan-300/90">src/content/strategic-priorities.json</code>. Cursor
        адаптирует autonomous loop без постоянных micro-TZ.
      </p>
      <p className="mt-2 text-xs text-slate-600">
        API:{" "}
        <Link href="/api/strategic-priorities" className="font-mono text-cyan-400 hover:underline">
          /api/strategic-priorities
        </Link>
        {" · "}
        <Link href={ecosystemRoutes.operationsExecution} className="text-cyan-500 hover:underline">
          Execution audit
        </Link>
      </p>
      <OperationsSubNav />

      <div className="mt-8">
        <OwnerDirectivePanel payload={payload} />
      </div>

      <section className="mt-10">
        <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-400/90">
          Autonomous next targets ({autonomousTargets.length})
        </h2>
        <ul className="mt-3 space-y-1 text-sm text-slate-300">
          {autonomousTargets.map((t) => (
            <li key={t} className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
              {t}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">Приоритеты</h2>
        <PriorityBoard items={payload.priorities} />
      </section>

      <section className="mt-12">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">Dependency graph</h2>
        <DependencyGraphBoard graph={payload.dependencyGraph} priorities={payload.priorities} />
      </section>

      <section className="mt-12 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <h2 className="text-xs font-bold uppercase tracking-widest text-violet-300/80">Cursor adaptation</h2>
        <CursorAdaptationRules rules={payload.cursorAdaptationRules} />
      </section>

      <p className="mt-12 text-xs text-slate-600">
        Изменить приоритеты: отредактируйте{" "}
        <code className="font-mono text-slate-400">strategic-priorities.json</code> в репозитории aion-com и
        задеплойте портал.
      </p>
    </div>
  );
}
