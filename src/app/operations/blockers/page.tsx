import type { Metadata } from "next";
import { loadExecutionAuditView, BlockersList, OperationsSubNav, RiskBoard } from "@/components/operations/ExecutionAuditPanels";
import { TechnicalDebtBoard } from "@/components/ecosystem/EcosystemAuditViews";

export const metadata: Metadata = {
  title: "Blockers — операции AION",
  description: "Открытые блокеры, риски и технический долг экосистемы.",
};

export default async function OperationsBlockersPage() {
  const view = await loadExecutionAuditView();

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20">
      <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-rose-400/90">Blockers</p>
      <h1 className="mt-3 text-3xl font-bold text-white">Блокеры и риски</h1>
      <p className="mt-3 text-sm text-slate-400">Источник: roadmap-execution.json + ecosystem-status.json (без скрытых блокеров).</p>
      <OperationsSubNav />
      <section className="mt-10">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">Очередь блокеров</h2>
        <BlockersList view={view} />
      </section>
      <section className="mt-12">
        <h2 className="text-xs font-bold uppercase tracking-widest text-amber-300/80">Зоны риска</h2>
        <RiskBoard view={view} />
      </section>
      <section className="mt-12">
        <h2 className="text-xs font-bold uppercase tracking-widest text-rose-300/80">Технический долг</h2>
        <div className="mt-4">
          <TechnicalDebtBoard items={view.eco.technicalDebt ?? []} />
        </div>
      </section>
    </div>
  );
}
