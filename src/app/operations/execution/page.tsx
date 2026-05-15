import type { Metadata } from "next";
import {
  AuditFeedCard,
  loadExecutionAuditView,
  NextActionPanel,
  OperationsSubNav,
} from "@/components/operations/ExecutionAuditPanels";
import { t } from "@/i18n";

export const metadata: Metadata = {
  title: t("operations.pages.execution.metaTitle"),
  description: t("operations.pages.execution.metaDescription"),
};

export default async function OperationsExecutionPage() {
  const view = await loadExecutionAuditView();
  const audited = view.feed.items.filter((ev) => ev.eventType || ev.reasoning);

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20">
      <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-violet-400/90">
        {t("operations.pages.execution.eyebrow")}
      </p>
      <h1 className="mt-3 text-3xl font-bold text-white md:text-4xl">{t("operations.pages.execution.title")}</h1>
      <p className="mt-3 max-w-3xl text-sm text-slate-400">{t("operations.pages.execution.intro")}</p>
      <OperationsSubNav />
      <div className="mt-8">
        <NextActionPanel view={view} />
      </div>
      <section className="mt-12">
        <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-400/90">
          {t("operations.pages.execution.feed", { count: audited.length })}
        </h2>
        <ul className="mt-6 space-y-6">
          {audited.length ? (
            audited.map((ev) => <AuditFeedCard key={ev.id} ev={ev} />)
          ) : (
            <li className="text-sm text-slate-500">{t("operations.pages.execution.feedEmpty")}</li>
          )}
        </ul>
      </section>
    </div>
  );
}
