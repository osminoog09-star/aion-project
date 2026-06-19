import Link from "next/link";
import status from "@/content/codex-work-status.json";

const statusTone: Record<string, string> = {
  in_progress: "border-cyan-400/30 bg-cyan-500/10 text-cyan-100",
  success: "border-emerald-400/30 bg-emerald-500/10 text-emerald-100",
  failure: "border-rose-400/30 bg-rose-500/10 text-rose-100",
};

export function CodexWorkStatusPanel() {
  const run = status.latestRun;
  const tone = statusTone[run.status] ?? "border-slate-400/20 bg-slate-500/10 text-slate-100";

  return (
    <section className="mt-8 rounded-2xl border border-cyan-500/25 bg-slate-950/70 p-5 shadow-[0_0_40px_rgba(34,211,238,0.05)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-300/90">
            Что сейчас делает Codex
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">{status.priority}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">{status.headline}</p>
        </div>
        <div className={`rounded-xl border px-3 py-2 text-xs font-semibold ${tone}`}>
          {status.currentStatus}
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Текущий фокус</p>
          <p className="mt-2 text-sm leading-6 text-slate-200">{status.currentFocus}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
            <Link href={run.url} className="text-cyan-300 hover:text-cyan-200">
              {run.label} →
            </Link>
            <span className="rounded-full bg-white/5 px-2 py-1 font-mono text-slate-400">{run.status}</span>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Проверки</p>
          <ul className="mt-2 space-y-2 text-xs leading-5 text-slate-300">
            {status.checks.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-300/80">Сделано</p>
          <ul className="mt-2 space-y-2 text-xs leading-5 text-slate-300">
            {status.completed.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-300/80">Дальше</p>
          <ul className="mt-2 space-y-2 text-xs leading-5 text-slate-300">
            {status.next.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      <p className="mt-5 text-[10px] text-slate-600">Обновлено: {status.lastUpdated}</p>
    </section>
  );
}
