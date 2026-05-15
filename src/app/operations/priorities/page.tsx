import type { Metadata } from "next";
import Link from "next/link";
import { OperationsSubNav } from "@/components/operations/ExecutionAuditPanels";
import {
  CursorAdaptationRules,
  DependencyGraphBoard,
  OwnerDirectivePanel,
  PriorityBoard,
} from "@/components/operations/PriorityControlPanels";
import { PriorityControlEditor } from "@/components/operations/PriorityControlEditor";
import { t } from "@/i18n";
import { getEcosystemStatus } from "@/lib/ecosystem-data";
import { isOwnerAuthenticated, isOwnerAuthConfigured } from "@/lib/operations/owner-auth";
import { buildAutonomousNextTargets, getStrategicPriorities } from "@/lib/strategic-priorities";
import { ecosystemRoutes } from "@/lib/ecosystem-routes";

export const metadata: Metadata = {
  title: t("operations.pages.priorities.metaTitle"),
  description: t("operations.pages.priorities.metaDescription"),
};

export const dynamic = "force-dynamic";

export default async function OperationsPrioritiesPage() {
  const [payload, eco, authenticated, authConfigured] = await Promise.all([
    getStrategicPriorities(),
    getEcosystemStatus(),
    isOwnerAuthenticated(),
    Promise.resolve(isOwnerAuthConfigured()),
  ]);
  const autonomousTargets = buildAutonomousNextTargets(payload);

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20">
      <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-amber-400/90">
        {t("operations.pages.priorities.eyebrow")}
      </p>
      <h1 className="mt-3 text-3xl font-bold text-white md:text-4xl">{t("operations.pages.priorities.title")}</h1>
      <p className="mt-3 max-w-3xl text-sm text-slate-400">{t("operations.pages.priorities.intro")}</p>
      <p className="mt-2 text-xs text-slate-600">
        {t("operations.pages.priorities.apiHint")}{" "}
        <Link href="/api/strategic-priorities" className="font-mono text-cyan-400 hover:underline">
          /api/strategic-priorities
        </Link>
        {" · "}
        <Link href={ecosystemRoutes.operationsExecution} className="text-cyan-500 hover:underline">
          {t("operations.pages.priorities.executionLink")}
        </Link>
      </p>
      <OperationsSubNav />

      <PriorityControlEditor
        initial={payload}
        executionQueue={eco.executionQueue}
        authConfigured={authConfigured}
        initialAuthenticated={authenticated}
      />

      <div className="mt-10">
        <OwnerDirectivePanel payload={payload} />
      </div>

      <section className="mt-10">
        <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-400/90">
          {t("operations.pages.priorities.autonomousTargets", { count: autonomousTargets.length })}
        </h2>
        <ul className="mt-3 space-y-1 text-sm text-slate-300">
          {autonomousTargets.map((target) => (
            <li key={target} className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
              {target}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">{t("common.readOnlyBoard")}</h2>
        <PriorityBoard items={payload.priorities} />
      </section>

      <section className="mt-12">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">{t("common.dependencyGraph")}</h2>
        <DependencyGraphBoard graph={payload.dependencyGraph} priorities={payload.priorities} />
      </section>

      <section className="mt-12 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <h2 className="text-xs font-bold uppercase tracking-widest text-violet-300/80">{t("common.cursorAdaptation")}</h2>
        <CursorAdaptationRules rules={payload.cursorAdaptationRules} />
      </section>
    </div>
  );
}
