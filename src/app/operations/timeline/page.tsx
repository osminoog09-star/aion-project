import type { Metadata } from "next";
import Link from "next/link";
import { getEcosystemStatus, getLocalImplementationFeed } from "@/lib/ecosystem-data";
import { getSiteUrl } from "@/lib/site-url";
import { ecosystemRoutes } from "@/lib/ecosystem-routes";
import { AuditFeedCard, OperationsSubNav } from "@/components/operations/ExecutionAuditPanels";
import { t } from "@/i18n";

export const metadata: Metadata = {
  title: t("operations.pages.timeline.metaTitle"),
  description: t("operations.pages.timeline.metaDescription"),
};

export default async function OperationsTimelinePage() {
  const feed = getLocalImplementationFeed();
  const eco = await getEcosystemStatus();
  const base = getSiteUrl().replace(/\/$/, "");

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20">
      <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-emerald-400/90">
        {t("operations.pages.timeline.eyebrow")}
      </p>
      <h1 className="mt-3 text-3xl font-bold text-white md:text-4xl">{t("operations.pages.timeline.title")}</h1>
      <p className="mt-3 max-w-3xl text-sm text-slate-400">{feed.policy}</p>
      <p className="mt-2 text-xs text-slate-600">
        {t("operations.pages.timeline.jsonLabel")}{" "}
        <a href={`${base}/api/implementation-feed`} className="font-mono text-cyan-400 hover:underline">
          /api/implementation-feed
        </a>
        · {t("operations.pages.timeline.visionLabel")}{" "}
        <Link href={ecosystemRoutes.ecosystem} className="text-cyan-500 hover:underline">
          /ecosystem
        </Link>
      </p>
      <OperationsSubNav />

      <section className="mt-10">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">{t("common.validationMatrix")}</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-slate-500">
                <th className="py-2 pr-4">{t("common.signal")}</th>
                <th className="py-2 pr-4">{t("common.status")}</th>
                <th className="py-2 pr-4">{t("common.date")}</th>
                <th className="py-2">{t("common.evidence")}</th>
              </tr>
            </thead>
            <tbody>
              {feed.validationMatrix.map((r) => (
                <tr key={r.id} className="border-b border-white/5 text-slate-300">
                  <td className="py-2 pr-4 font-mono text-xs text-cyan-200/90">{r.id}</td>
                  <td className="py-2 pr-4">{r.lastKnown}</td>
                  <td className="py-2 pr-4 text-xs text-slate-500">{r.lastSignalAt ?? "—"}</td>
                  <td className="py-2 text-xs text-slate-500">{r.evidence ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-400/90">
          {t("common.events")} ({feed.items.length})
        </h2>
        <p className="mt-2 text-xs text-slate-600">
          {t("common.updated")} feed: {feed.lastUpdated} · {t("common.ecosystemJson")}: {eco.lastUpdated}
        </p>
        <ul className="mt-6 space-y-6">
          {feed.items.map((ev) => (
            <AuditFeedCard key={ev.id} ev={ev} />
          ))}
        </ul>
      </section>

      <p className="mt-12 text-xs text-slate-600">
        <Link href={ecosystemRoutes.operationsContext} className="text-cyan-500 hover:underline">
          ← {t("common.contextLink")}
        </Link>
        {" · "}
        <Link href={ecosystemRoutes.control} className="text-cyan-500 hover:underline">
          {t("nav.control")}
        </Link>
      </p>
    </div>
  );
}
