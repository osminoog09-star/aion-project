import type { Metadata } from "next";
import Link from "next/link";
import { OperationsSubNav } from "@/components/operations/ExecutionAuditPanels";
import {
  OrchestrationFlowCallout,
  ReviewQueueStatsBar,
  ReviewRequestCard,
} from "@/components/operations/ArchitectureReviewPanels";
import { t } from "@/i18n";
import {
  computeReviewQueueStats,
  filterActiveQueue,
  getArchitectureReviewQueue,
  sortRequestsNewest,
} from "@/lib/architecture-reviews";
import { ecosystemRoutes } from "@/lib/ecosystem-routes";

export const metadata: Metadata = {
  title: t("operations.pages.reviewQueue.metaTitle"),
  description: t("operations.pages.reviewQueue.metaDescription"),
};

export default function OperationsReviewQueuePage() {
  const queue = getArchitectureReviewQueue();
  const active = filterActiveQueue(sortRequestsNewest(queue.requests));
  const stats = computeReviewQueueStats(queue.requests);

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20">
      <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-amber-400/90">
        {t("operations.pages.reviewQueue.eyebrow")}
      </p>
      <h1 className="mt-3 text-3xl font-bold text-white md:text-4xl">{t("operations.pages.reviewQueue.title")}</h1>
      <p className="mt-3 max-w-3xl text-sm text-slate-400">{t("operations.pages.reviewQueue.intro")}</p>
      <OperationsSubNav />
      <ReviewQueueStatsBar stats={stats} />
      <p className="mt-4 text-xs text-slate-500">
        <Link href={ecosystemRoutes.operationsReviews} className="text-cyan-400 hover:underline">
          {t("operations.pages.reviewQueue.fullHistory")}
        </Link>
        {" · "}
        {t("operations.pages.reviewQueue.escalateVia")}{" "}
        <span className="font-mono text-slate-400">npm run review:request</span> {t("operations.pages.reviewQueue.agentHint")}{" "}
        <span className="font-mono">X-Aion-Agent-Key</span>
      </p>
      <OrchestrationFlowCallout queue={queue} />
      <section className="mt-10">
        <h2 className="text-xs font-bold uppercase tracking-widest text-amber-300/90">
          {t("operations.pages.reviewQueue.queue", { count: active.length })}
        </h2>
        <ul className="mt-6 space-y-6">
          {active.length ? (
            active.map((r) => (
              <li key={r.id}>
                <ReviewRequestCard request={r} />
              </li>
            ))
          ) : (
            <li className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-sm text-slate-500">
              {t("operations.pages.reviewQueue.empty")}
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}
