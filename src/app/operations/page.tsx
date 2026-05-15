import type { Metadata } from "next";
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
  title: "Operations — исполнение экосистемы",
  description:
    "Приоритеты, блокеры, техдолг и операционное здоровье модульной AI-платформы AION: облако, realtime, релизы.",
};

export default async function OperationsPage() {
  const [eco, hub] = await Promise.all([getEcosystemStatus(), getOperationsHubView()]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20">
      <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-violet-400/90">Operations center</p>
      <h1 className="mt-3 text-3xl font-bold text-white md:text-4xl">Operations</h1>
      <p className="mt-3 max-w-3xl text-sm text-slate-400">
        Единый слой исполнения платформы: приоритеты, блокеры, планка качества, облачный SoT и метрики для всех
        модулей.
      </p>
      <div className="mt-4">
        <RoadmapHubLinks />
      </div>
      <OperationsSubNav />

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
        <h2 className="text-sm font-bold uppercase tracking-widest text-cyan-400/90">Операционное здоровье</h2>
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
        <h2 className="text-sm font-bold uppercase tracking-widest text-rose-300/80">Технический долг</h2>
        <div className="mt-4">
          <TechnicalDebtBoard items={eco.technicalDebt ?? []} />
        </div>
      </section>
    </div>
  );
}
