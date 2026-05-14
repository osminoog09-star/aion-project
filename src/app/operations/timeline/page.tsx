import type { Metadata } from "next";
import Link from "next/link";
import { getEcosystemStatus, getLocalImplementationFeed } from "@/lib/ecosystem-data";
import { getSiteUrl } from "@/lib/site-url";
import { ecosystemRoutes } from "@/lib/ecosystem-routes";

export const metadata: Metadata = {
  title: "Timeline — внедрения и валидация",
  description:
    "Живая лента изменений экосистемы, матрица валидации и связь с roadmap; данные из ecosystem-implementation-feed.json.",
};

export default async function OperationsTimelinePage() {
  const feed = getLocalImplementationFeed();
  const eco = await getEcosystemStatus();
  const base = getSiteUrl().replace(/\/$/, "");

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20">
      <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-emerald-400/90">Live reporting</p>
      <h1 className="mt-3 text-3xl font-bold text-white md:text-4xl">Implementation timeline</h1>
      <p className="mt-3 max-w-3xl text-sm text-slate-400">{feed.policy}</p>
      <p className="mt-2 text-xs text-slate-600">
        JSON:{" "}
        <a href={`${base}/api/implementation-feed`} className="font-mono text-cyan-400 hover:underline">
          /api/implementation-feed
        </a>
        · vision:{" "}
        <Link href={ecosystemRoutes.ecosystem} className="text-cyan-500 hover:underline">
          /ecosystem
        </Link>
      </p>

      <section className="mt-10">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">Матрица валидации</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-slate-500">
                <th className="py-2 pr-4">Сигнал</th>
                <th className="py-2 pr-4">Статус</th>
                <th className="py-2 pr-4">Дата</th>
                <th className="py-2">Доказательство</th>
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
        <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-400/90">События ({feed.items.length})</h2>
        <p className="mt-2 text-xs text-slate-600">Обновлено в feed: {feed.lastUpdated} · ecosystem JSON: {eco.lastUpdated}</p>
        <ul className="mt-6 space-y-6">
          {feed.items.map((ev) => (
            <li key={ev.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-lg font-semibold text-white">{ev.title}</h3>
                <span className="font-mono text-xs text-slate-500">{ev.occurredAt}</span>
              </div>
              <p className="mt-2 text-sm text-slate-400">{ev.summary}</p>
              <p className="mt-2 text-xs text-slate-500">
                Подсистемы:{" "}
                <span className="font-mono text-slate-400">{ev.subsystemIds.join(", ")}</span>
                {ev.commitHash ? (
                  <>
                    {" "}
                    · commit <span className="font-mono">{ev.commitHash}</span>
                  </>
                ) : null}
                {ev.repository ? (
                  <>
                    {" "}
                    · <span className="font-mono">{ev.repository}</span>
                  </>
                ) : null}
              </p>
              <div className="mt-4 grid gap-3 text-xs md:grid-cols-2">
                <div>
                  <p className="font-bold uppercase tracking-wider text-slate-500">Rollup</p>
                  <ul className="mt-1 space-y-1 text-slate-400">
                    {[...ev.rollup.fullyDone, ...ev.rollup.partiallyDone, ...ev.rollup.notStarted, ...ev.rollup.technicalDebt].map(
                      (line) => (
                        <li key={line}>{line}</li>
                      ),
                    )}
                  </ul>
                </div>
                <div>
                  <p className="font-bold uppercase tracking-wider text-slate-500">Пробелы / блок</p>
                  <p className="mt-1 text-slate-400">{ev.stillMissing.join(" · ") || "—"}</p>
                  <p className="mt-2 text-rose-200/80">{ev.blocked.join(" · ") || "—"}</p>
                </div>
              </div>
              <p className="mt-3 text-[10px] uppercase tracking-wider text-slate-600">
                validation:{" "}
                <span className="font-mono normal-case text-slate-400">
                  {Object.entries(ev.validation)
                    .map(([k, v]) => `${k}=${v}`)
                    .join(", ") || "—"}
                </span>
              </p>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-12 text-xs text-slate-600">
        <Link href={ecosystemRoutes.operationsContext} className="text-cyan-500 hover:underline">
          ← Operations context
        </Link>
        {" · "}
        <Link href={ecosystemRoutes.control} className="text-cyan-500 hover:underline">
          Control
        </Link>
      </p>
    </div>
  );
}
