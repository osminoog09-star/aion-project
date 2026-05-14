import type { Metadata } from "next";
import Link from "next/link";
import { getEcosystemStatus } from "@/lib/ecosystem-data";
import { buildRoadmapExecutionPayload } from "@/lib/roadmap-execution";
import { getSiteUrl } from "@/lib/site-url";
import { ecosystemRoutes } from "@/lib/ecosystem-routes";

export const metadata: Metadata = {
  title: "Roadmap execution — очередь и следующий шаг",
  description:
    "Живая очередь исполнения, AI execution notes и next-best-action по подсистемам; данные из roadmap-execution.json и расширений roadmap.",
};

function ListBlock({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
      <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-400/90">{title}</h2>
      <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-slate-400">
        {items.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
    </section>
  );
}

export default async function RoadmapExecutionPage() {
  const eco = await getEcosystemStatus();
  const ex = buildRoadmapExecutionPayload(eco);
  const q = ex.executionQueue;
  const notes = ex.aiExecutionNotes;
  const base = getSiteUrl().replace(/\/$/, "");
  const hinted = ex.nextBestActions.filter((a) => a.nextRecommendedStep || a.biggestWeakness);

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20">
      <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-violet-400/90">Execution engine</p>
      <h1 className="mt-3 text-3xl font-bold text-white md:text-4xl">Roadmap → execution</h1>
      <p className="mt-3 max-w-3xl text-sm text-slate-400">
        Roadmap — источник исполнения: очередь приоритетов, философия агентов и «следующий лучший шаг» по подсистемам с
        расширенным профилем. JSON:{" "}
        <a className="font-mono text-cyan-400 hover:underline" href={`${base}/api/roadmap/execution`}>
          /api/roadmap/execution
        </a>
        ; полный контекст:{" "}
        <a className="font-mono text-cyan-400 hover:underline" href={`${base}/api/aion/context`}>
          /api/aion/context
        </a>{" "}
        (<span className="font-mono text-slate-500">executionEngine</span>).
      </p>

      {q ? (
        <section className="mt-10 rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.04] p-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-300/90">Активная очередь</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Эпик</dt>
              <dd className="text-slate-100">{q.currentActiveEpic}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Фокус подсистемы</dt>
              <dd className="font-mono text-cyan-200">{q.currentSubsystemFocus}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Следующая цель реализации</dt>
              <dd className="text-slate-300">{q.nextImplementationTarget}</dd>
            </div>
          </dl>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <ListBlock title="Blocked" items={q.blockedTasks} />
            <ListBlock title="Release blockers" items={q.releaseBlockers} />
            <ListBlock title="UX blockers" items={q.uxBlockers} />
            <ListBlock title="Backend blockers" items={q.backendBlockers} />
          </div>
        </section>
      ) : null}

      {notes ? (
        <section className="mt-10 space-y-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">AI execution notes</h2>
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
            <h3 className="text-[10px] font-bold uppercase text-emerald-400/90">Принципы архитектуры</h3>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-400">
              {notes.architecturePrinciples.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 p-4 text-sm text-slate-400">
              <p>
                <span className="font-semibold text-slate-200">No fake done:</span> {notes.noFakeDoneRule}
              </p>
              <p className="mt-2">
                <span className="font-semibold text-slate-200">Finish before switch:</span>{" "}
                {notes.finishBeforeSwitchingRule}
              </p>
              <p className="mt-2">
                <span className="font-semibold text-slate-200">Cloud SoT:</span> {notes.cloudSourceOfTruthPolicy}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 p-4 text-sm text-slate-400">
              <p>
                <span className="font-semibold text-slate-200">Realtime-first:</span> {notes.realtimeFirstDirection}
              </p>
              <p className="mt-2">
                <span className="font-semibold text-slate-200">Ecosystem-first:</span>{" "}
                {notes.ecosystemFirstArchitecture}
              </p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-violet-500/20 p-4">
              <h3 className="text-[10px] font-bold uppercase text-violet-300/90">ChatGPT (strategy)</h3>
              <ul className="mt-2 list-inside list-disc text-sm text-slate-400">
                {notes.collaborationModel.chatgpt.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-cyan-500/20 p-4">
              <h3 className="text-[10px] font-bold uppercase text-cyan-300/90">Cursor (execution)</h3>
              <ul className="mt-2 list-inside list-disc text-sm text-slate-400">
                {notes.collaborationModel.cursor.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      ) : null}

      <section className="mt-14">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">Next best action (подсистемы с профилем)</h2>
        <p className="mt-2 text-xs text-slate-600">
          Остальные строки в JSON <span className="font-mono">nextBestActions</span> без расширения — поля пустые.
        </p>
        <div className="mt-6 space-y-4">
          {hinted.map((a) => (
            <article key={a.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-sm font-semibold text-white">
                  {a.name}{" "}
                  <span className="font-mono text-xs font-normal text-slate-500">({a.id})</span>
                </h3>
                <span className="text-xs text-slate-500">
                  {a.readinessPercent}% · {a.status}
                </span>
              </div>
              {a.biggestWeakness ? <p className="mt-2 text-sm text-rose-200/90">Слабое место: {a.biggestWeakness}</p> : null}
              {a.highestValueImprovement ? (
                <p className="mt-1 text-sm text-emerald-200/85">Максимум пользы: {a.highestValueImprovement}</p>
              ) : null}
              {a.nextRecommendedStep ? (
                <p className="mt-2 text-sm text-cyan-100/90">
                  <span className="font-semibold text-cyan-400/90">Шаг:</span> {a.nextRecommendedStep}
                </p>
              ) : null}
              {a.requiredDependencies.length ? (
                <p className="mt-2 text-xs text-slate-500">Зависимости: {a.requiredDependencies.join(" · ")}</p>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <p className="mt-12 text-xs text-slate-600">
        <Link href={ecosystemRoutes.roadmap} className="text-cyan-500 hover:underline">
          ← Roadmap
        </Link>
        {" · "}
        <Link href={ecosystemRoutes.operationsContext} className="text-cyan-500 hover:underline">
          Operations context
        </Link>
        {" · "}
        <Link href={ecosystemRoutes.operations} className="text-cyan-500 hover:underline">
          /operations
        </Link>
      </p>
    </div>
  );
}
