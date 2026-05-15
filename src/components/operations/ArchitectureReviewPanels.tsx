"use client";

import { useState } from "react";
import { confidenceLabel, reviewStatusLabel, t } from "@/i18n";
import { ru } from "@/i18n/locales/ru";
import type {
  ArchitectureReviewQueuePayload,
  ArchitectureReviewRequest,
  ArchitectureReviewTemplate,
} from "@/lib/ecosystem-types";
import { statusBadgeClass, type ReviewQueueStats } from "@/lib/architecture-reviews";

function CopyPacketButton({ markdown }: { markdown: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(markdown).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
      }}
      className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-200"
    >
      {copied ? t("common.copied") : t("common.copyPacket")}
    </button>
  );
}

export function ReviewQueueStatsBar({ stats }: { stats: ReviewQueueStats }) {
  const items = [
    ["pending", stats.pending],
    ["reviewing", stats.reviewing],
    ["approved", stats.approved],
    ["risky", stats.risky],
    ["blocked", stats.blocked],
    ["resolved", stats.resolved],
  ] as const;
  return (
    <div className="mt-6 flex flex-wrap gap-2">
      {items.map(([label, n]) => (
        <span
          key={label}
          className={`rounded-full border px-3 py-1 text-xs font-bold uppercase ${statusBadgeClass(label)}`}
        >
          {reviewStatusLabel(label)} {n}
        </span>
      ))}
    </div>
  );
}

export function ReviewRequestCard({ request }: { request: ArchitectureReviewRequest }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-violet-400/90">
            {request.templateId}
          </p>
          <h3 className="mt-1 text-lg font-semibold text-white">{request.title}</h3>
          <p className="mt-1 text-xs text-slate-500">
            {request.subsystem} · {request.id} · {request.createdAt.slice(0, 10)}
          </p>
        </div>
        <span
          className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase ${statusBadgeClass(request.status)}`}
        >
          {reviewStatusLabel(request.status)}
        </span>
      </div>
      <p className="mt-3 text-sm text-slate-300">{request.reasoning}</p>
      <p className="mt-2 text-xs text-amber-200/80">
        <span className="text-slate-500">{t("common.architecture")}: </span>
        {request.architectureConcern}
      </p>
      <p className="mt-2 text-xs text-cyan-200/80">
        <span className="text-slate-500">{t("common.direction")}: </span>
        {request.proposedDirection}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <CopyPacketButton markdown={request.reviewPacket.markdown} />
        <span className="rounded-lg border border-white/10 px-2 py-1 text-[10px] text-slate-500">
          {t("operations.audit.confidencePrefix")} {confidenceLabel(request.confidence)}
        </span>
      </div>
      {request.result ? (
        <div className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-slate-300">
          <p className="font-semibold text-emerald-300">
            {t("common.result")} ({request.result.reviewedBy})
          </p>
          {request.result.approvedDirection ? (
            <p className="mt-1">{request.result.approvedDirection}</p>
          ) : null}
          {request.result.warnings?.length ? (
            <ul className="mt-2 list-inside list-disc text-amber-200/90">
              {request.result.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
      {request.linkedCommitHashes?.length ? (
        <p className="mt-2 font-mono text-[10px] text-slate-600">
          {t("common.commits")}: {request.linkedCommitHashes.join(", ")}
        </p>
      ) : null}
    </article>
  );
}

export function ReviewTemplatesGrid({ templates }: { templates: ArchitectureReviewTemplate[] }) {
  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-2">
      {templates.map((t) => (
        <div key={t.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <p className="text-sm font-semibold text-white">{t.title}</p>
          <p className="mt-1 text-xs text-slate-500">{t.description}</p>
          <ul className="mt-2 list-inside list-disc text-[11px] text-slate-600">
            {t.escalationTriggers.slice(0, 3).map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function OrchestrationFlowCallout({ queue }: { queue: ArchitectureReviewQueuePayload }) {
  const flowSteps = ru.operations.reviews.flowSteps;
  return (
    <div className="mt-8 rounded-2xl border border-violet-500/25 bg-violet-500/5 p-5 text-sm text-slate-300">
      <p className="text-xs font-bold uppercase tracking-widest text-violet-300/90">
        {t("operations.reviews.flowTitle", { version: queue.orchestrationVersion })}
      </p>
      <ol className="mt-3 list-inside list-decimal space-y-1 text-xs text-slate-400">
        {flowSteps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <p className="mt-3 text-[11px] text-slate-500">{queue.policy}</p>
    </div>
  );
}
