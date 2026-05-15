import type { Metadata } from "next";
import Link from "next/link";
import { OperationsSubNav } from "@/components/operations/ExecutionAuditPanels";
import {
  OrchestrationFlowCallout,
  ReviewQueueStatsBar,
  ReviewRequestCard,
  ReviewTemplatesGrid,
} from "@/components/operations/ArchitectureReviewPanels";
import {
  computeReviewQueueStats,
  getArchitectureReviewQueue,
  sortRequestsNewest,
} from "@/lib/architecture-reviews";
import { ecosystemRoutes } from "@/lib/ecosystem-routes";

export const metadata: Metadata = {
  title: "Architecture reviews — AI orchestration",
  description:
    "Review history, ChatGPT packets, and architecture escalation — owner observes, Cursor self-escalates.",
};

export default function OperationsReviewsPage() {
  const queue = getArchitectureReviewQueue();
  const history = sortRequestsNewest(queue.requests);
  const stats = computeReviewQueueStats(queue.requests);

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20">
      <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-violet-400/90">
        AI orchestration bridge
      </p>
      <h1 className="mt-3 text-3xl font-bold text-white md:text-4xl">Architecture reviews</h1>
      <p className="mt-3 max-w-3xl text-sm text-slate-400">
        История review-запросов, structured packets для ChatGPT, связь с roadmap и feed. Owner — observer,
        не relay.
      </p>
      <OperationsSubNav />
      <ReviewQueueStatsBar stats={stats} />
      <div className="mt-4 flex flex-wrap gap-3 text-xs">
        <Link
          href={ecosystemRoutes.operationsReviewQueue}
          className="text-cyan-400 hover:underline"
        >
          Active queue →
        </Link>
        <Link href="/api/architecture-reviews" className="font-mono text-slate-500 hover:text-cyan-400">
          /api/architecture-reviews
        </Link>
      </div>
      <OrchestrationFlowCallout queue={queue} />
      <section className="mt-10">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">Templates</h2>
        <ReviewTemplatesGrid templates={queue.templates} />
      </section>
      <section className="mt-12">
        <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-400/90">
          History ({history.length})
        </h2>
        <ul className="mt-6 space-y-6">
          {history.length ? (
            history.map((r) => (
              <li key={r.id}>
                <ReviewRequestCard request={r} />
              </li>
            ))
          ) : (
            <li className="text-sm text-slate-500">
              Нет запросов. Cursor:{" "}
              <span className="font-mono text-slate-400">npm run review:request</span>
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}
