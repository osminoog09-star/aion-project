import type { Metadata } from "next";
import Link from "next/link";
import { t } from "@/i18n";
import { ecosystemRoutes } from "@/lib/ecosystem-routes";
import { getEcosystemStatus } from "@/lib/ecosystem-data";
import { getOperationsHubView } from "@/lib/operations-hub-data";
import { OperationsHub } from "@/components/operations/OperationsHub";
import {
  CloudSoTPanel,
  CursorRulesPanel,
  ExecutionPanel,
  ReleaseQualityPanel,
  RoadmapHubLinks,
} from "@/components/ecosystem/MasterRoadmapPanels";
import { DefinitionOfDoneCallout, OperationsDashboard, ReadinessPillarGrid, TechnicalDebtBoard } from "@/components/ecosystem/EcosystemAuditViews";
import { OperationsSubNav } from "@/components/operations/ExecutionAuditPanels";

export const metadata: Metadata = {
  title: t("operations.pages.center.metaTitle"),
  description: t("operations.pages.center.metaDescription"),
};

export default async function OperationsPage() {
  const [eco, hub] = await Promise.all([getEcosystemStatus(), getOperationsHubView()]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20">
      <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-violet-400/90">
        {t("operations.pages.center.eyebrow")}
      </p>
      <h1 className="mt-3 text-3xl font-bold text-white md:text-4xl">{t("operations.pages.center.title")}</h1>
      <p className="mt-3 max-w-3xl text-sm text-slate-400">{t("operations.pages.center.description")}</p>
      <div className="mt-4">
        <RoadmapHubLinks />
      </div>
      <OperationsSubNav />

      <Link
        href={ecosystemRoutes.operationsCommand}
        className="mt-6 flex items-center justify-between rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 to-violet-500/10 px-5 py-4 transition hover:border-cyan-400/50"
      >
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-300/90">
            Центр управления AI
          </p>
          <p className="mt-1 text-sm text-white">Roadmap блоками · очередь · здоровье проекта</p>
        </div>
        <span className="text-cyan-400">→</span>
      </Link>

      <div className="mt-8">
        <OperationsHub view={hub} variant="compact" />
      </div>

      {eco.execution ? (
        <div className="mt-10">
          <ExecutionPanel ex={eco.execution} />
        </div>
      ) : null}

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        {eco.releaseQualityBar?.length ? <ReleaseQualityPanel lines={eco.releaseQualityBar} /> : null}
        {eco.definitionOfDone?.length ? <DefinitionOfDoneCallout lines={eco.definitionOfDone} /> : null}
      </div>

      {eco.cursorExecutionRules?.length ? (
        <div className="mt-10">
          <CursorRulesPanel rules={eco.cursorExecutionRules} />
        </div>
      ) : null}

      <div className="mt-10">
        <CloudSoTPanel eco={eco} />
      </div>

      <section className="mt-12">
        <h2 className="text-sm font-bold uppercase tracking-widest text-cyan-400/90">
          {t("operations.pages.center.health")}
        </h2>
        <div className="mt-6">
          <OperationsDashboard rows={eco.operations ?? []} />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500">Готовность направлений</h2>
        <div className="mt-6">
          <ReadinessPillarGrid readiness={eco.readiness} />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-sm font-bold uppercase tracking-widest text-rose-300/80">
          {t("operations.pages.center.techDebt")}
        </h2>
        <div className="mt-4">
          <TechnicalDebtBoard items={eco.technicalDebt ?? []} />
        </div>
      </section>
    </div>
  );
}
