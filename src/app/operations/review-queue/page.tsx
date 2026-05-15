import type { Metadata } from "next";
import Link from "next/link";
import { OperationsSubNav } from "@/components/operations/ExecutionAuditPanels";
import {
  OrchestrationFlowCallout,
  ReviewQueueStatsBar,
  ReviewRequestCard,
} from "@/components/operations/ArchitectureReviewPanels";
import {
  computeReviewQueueStats,
  filterActiveQueue,
  getArchitectureReviewQueue,
  sortRequestsNewest,
} from "@/lib/architecture-reviews";
import { ecosystemRoutes } from "@/lib/ecosystem-routes";

export const metadata: Metadata = {
  title: "Review queue — pending architecture",
  description: "Active architecture review queue for Cursor → ChatGPT escalation.",
};

export default function OperationsReviewQueuePage() {
  const queue = getArchitectureReviewQueue();
  const active = filterActiveQueue(sortRequestsNewest(queue.requests));
  const stats = computeReviewQueueStats(queue.requests);

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20">
      <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-amber-400/90">
        Review queue
      </p>
      <h1 className="mt-3 text-3xl font-bold text-white md:text-4xl">Active reviews</h1>
      <p className="mt-3 max-w-3xl text-sm text-slate-400">
        Pending и reviewing — autonomous execution продолжается на других приоритетах.
      </p>
      <OperationsSubNav />
      <ReviewQueueStatsBar stats={stats} />
      <p className="mt-4 text-xs text-slate-500">
        <Link href={ecosystemRoutes.operationsReviews} className="text-cyan-400 hover:underline">
          Full history
        </Link>
        {" · "}
        Cursor escalates via{" "}
        <span className="font-mono text-slate-400">npm run review:request</span> or POST with{" "}
        <span className="font-mono">X-Aion-Agent-Key</span>
      </p>
      <OrchestrationFlowCallout queue={queue} />
      <section className="mt-10">
        <h2 className="text-xs font-bold uppercase tracking-widest text-amber-300/90">
          Queue ({active.length})
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
              Очередь пуста — эскалация не требуется или все запросы закрыты.
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}
