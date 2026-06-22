import type { Metadata } from "next";
import { ReleaseSafetyBanner } from "@/components/operations/ReleaseSafetyBanner";
import {
  BlockersList,
  loadExecutionAuditView,
  OperationsSubNav,
  RiskBoard,
} from "@/components/operations/ExecutionAuditPanels";
import { TechnicalDebtBoard } from "@/components/ecosystem/EcosystemAuditViews";
import { t } from "@/i18n";

export const metadata: Metadata = {
  title: t("operations.pages.blockers.metaTitle"),
  description: t("operations.pages.blockers.metaDescription"),
};

export default async function OperationsBlockersPage() {
  const view = await loadExecutionAuditView();

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20">
      <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-rose-400/90">
        {t("operations.pages.blockers.eyebrow")}
      </p>
      <h1 className="mt-3 text-3xl font-bold text-white">{t("operations.pages.blockers.title")}</h1>
      <p className="mt-3 text-sm text-slate-400">{t("operations.pages.blockers.source")}</p>
      <OperationsSubNav />
      <ReleaseSafetyBanner />
      <section className="mt-10">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">
          {t("operations.pages.priorities.blockerQueue")}
        </h2>
        <BlockersList view={view} />
      </section>
      <section className="mt-12">
        <h2 className="text-xs font-bold uppercase tracking-widest text-amber-300/80">
          {t("operations.pages.priorities.riskZones")}
        </h2>
        <RiskBoard view={view} />
      </section>
      <section className="mt-12">
        <h2 className="text-xs font-bold uppercase tracking-widest text-rose-300/80">
          {t("operations.pages.center.techDebt")}
        </h2>
        <div className="mt-4">
          <TechnicalDebtBoard items={view.eco.technicalDebt ?? []} />
        </div>
      </section>
    </div>
  );
}
