import type { Metadata } from "next";
import { getEcosystemStatus } from "@/lib/ecosystem-data";

export const metadata: Metadata = {
  title: "Roadmap — статус экосистемы AION",
  description: "Официальная сводка готовности подсистем; данные ведутся в репозитории до API портала.",
};

function Bar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
      <div
        className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 transition-[width]"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export default function RoadmapPage() {
  const eco = getEcosystemStatus();

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20">
      <h1 className="text-3xl font-bold text-white md:text-4xl">Roadmap</h1>
      <p className="mt-3 max-w-3xl text-slate-400">{eco.methodology}</p>
      <p className="mt-2 text-xs text-slate-600">
        Обновлено: <time dateTime={eco.lastUpdated}>{eco.lastUpdated}</time>
      </p>

      <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.02] p-6 md:p-8">
        <h2 className="text-sm font-bold uppercase tracking-widest text-cyan-400/90">Текущий фокус</h2>
        <p className="mt-2 text-lg font-semibold text-white">{eco.sprint.label}</p>
        <p className="mt-1 text-slate-400">{eco.sprint.focus}</p>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500">Готовность направлений</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {Object.entries(eco.readiness).map(([key, value]) => (
            <div key={key} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium capitalize text-slate-300">{key.replace(/([A-Z])/g, " $1")}</span>
                <span className="tabular-nums text-cyan-300">{value}%</span>
              </div>
              <div className="mt-3">
                <Bar value={value} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500">Подсистемы</h2>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-white/10 bg-white/[0.03] text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Подсистема</th>
                <th className="px-4 py-3">%</th>
                <th className="px-4 py-3">Статус</th>
                <th className="px-4 py-3">Комментарий</th>
              </tr>
            </thead>
            <tbody>
              {eco.subsystems.map((s) => (
                <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-medium text-slate-200">{s.name}</td>
                  <td className="px-4 py-3 tabular-nums text-cyan-300">{s.percent}</td>
                  <td className="px-4 py-3 text-slate-400">{s.status}</td>
                  <td className="px-4 py-3 text-slate-500">{s.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-14 grid gap-8 md:grid-cols-2">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-400/90">Активные эпики</h3>
          <ul className="mt-3 list-inside list-disc text-slate-400">
            {eco.epics.active.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Завершённые вехи</h3>
          <ul className="mt-3 list-inside list-disc text-slate-500">
            {eco.epics.completed.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
