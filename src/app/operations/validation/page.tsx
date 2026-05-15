import type { Metadata } from "next";
import { loadExecutionAuditView, OperationsSubNav, ValidationDashboard } from "@/components/operations/ExecutionAuditPanels";

export const metadata: Metadata = {
  title: "Validation — операции AION",
  description: "Матрица typecheck, build, APK, OTA, OCR.",
};

export default async function OperationsValidationPage() {
  const view = await loadExecutionAuditView();

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20">
      <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-emerald-400/90">Validation</p>
      <h1 className="mt-3 text-3xl font-bold text-white">Validation dashboard</h1>
      <p className="mt-3 text-sm text-slate-400">{view.feed.policy}</p>
      <OperationsSubNav />
      <ValidationDashboard view={view} />
    </div>
  );
}
