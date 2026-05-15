import type { Metadata } from "next";
import { LiveExecutionPanel } from "@/components/operations/LiveExecutionPanel";
import { OperationsSubNav } from "@/components/operations/ExecutionAuditPanels";
import { buildLiveExecutionView, getLocalExecutionRuntime } from "@/lib/execution-runtime";
import { t } from "@/i18n";

export const metadata: Metadata = {
  title: t("operations.pages.live.metaTitle"),
  description: t("operations.pages.live.metaDescription"),
};

export default function OperationsLivePage() {
  const document = getLocalExecutionRuntime();
  const view = buildLiveExecutionView(document);

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20">
      <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-emerald-400/90">
        {t("operations.pages.live.eyebrow")}
      </p>
      <h1 className="mt-3 text-3xl font-bold text-white md:text-4xl">
        {t("operations.pages.live.title")}
      </h1>
      <p className="mt-3 max-w-3xl text-sm text-slate-400">{t("operations.pages.live.intro")}</p>
      <OperationsSubNav />
      <p className="mt-6 text-xs text-slate-500">
        SSR snapshot: {view.health.label} · обновление каждые 8с через API
      </p>
      <div className="mt-8">
        <LiveExecutionPanel />
      </div>
    </div>
  );
}
