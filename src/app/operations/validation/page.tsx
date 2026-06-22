import type { Metadata } from "next";
import { ReleaseSafetyBanner } from "@/components/operations/ReleaseSafetyBanner";
import {
  loadExecutionAuditView,
  OperationsSubNav,
  ValidationDashboard,
} from "@/components/operations/ExecutionAuditPanels";
import { t } from "@/i18n";

export const metadata: Metadata = {
  title: t("operations.pages.validation.metaTitle"),
  description: t("operations.pages.validation.metaDescription"),
};

export default async function OperationsValidationPage() {
  const view = await loadExecutionAuditView();

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20">
      <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-emerald-400/90">
        {t("operations.pages.validation.eyebrow")}
      </p>
      <h1 className="mt-3 text-3xl font-bold text-white">{t("operations.pages.validation.title")}</h1>
      <p className="mt-3 text-sm text-slate-400">{view.feed.policy}</p>
      <OperationsSubNav />
      <ReleaseSafetyBanner />
      <ValidationDashboard view={view} />
    </div>
  );
}
