import type { Metadata } from "next";
import { loadExecutionAuditView, NextActionPanel, OperationsSubNav, AuditFeedCard } from "@/components/operations/ExecutionAuditPanels";

export const metadata: Metadata = {
  title: "AI Execution — аудит действий Cursor",
  description: "Лента решений, reasoning, confidence и влияние на runtime/APK.",
};

export default async function OperationsExecutionPage() {
  const view = await loadExecutionAuditView();
  const audited = view.feed.items.filter((ev) => ev.eventType || ev.reasoning);

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20">
      <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-violet-400/90">AI execution audit</p>
      <h1 className="mt-3 text-3xl font-bold text-white md:text-4xl">Execution center</h1>
      <p className="mt-3 max-w-3xl text-sm text-slate-400">
        Видимость действий Cursor: что сделано, почему выбрана задача, какие файлы затронуты, влияние на runtime и APK.
      </p>
      <OperationsSubNav />
      <div className="mt-8">
        <NextActionPanel view={view} />
      </div>
      <section className="mt-12">
        <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-400/90">
          События с audit-полями ({audited.length})
        </h2>
        <ul className="mt-6 space-y-6">
          {audited.length ? (
            audited.map((ev) => <AuditFeedCard key={ev.id} ev={ev} />)
          ) : (
            <li className="text-sm text-slate-500">
              Пока нет событий с eventType/reasoning — используйте npm run feed:append с --event-type и --reasoning.
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}
