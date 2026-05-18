import type { Metadata } from "next";
import { OperationsSubNav } from "@/components/operations/ExecutionAuditPanels";
import { fetchDriverBugReports } from "@/lib/operations/fetch-driver-bug-reports";

export const metadata: Metadata = {
  title: "Отчёты Driver · AION Operations",
  description: "Баг-репорты и диагностика с мобильного приложения водителя",
};

export const dynamic = "force-dynamic";

export default async function OperationsBugsPage() {
  const reports = await fetchDriverBugReports(50);

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20">
      <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-rose-400/90">
        Driver · обратная связь
      </p>
      <h1 className="mt-3 text-3xl font-bold text-white md:text-4xl">Баг-репорты</h1>
      <p className="mt-3 max-w-3xl text-sm text-slate-400">
        Сообщения из приложения с категорией, описанием и полным журналом диагностики. Обновление при
        каждой загрузке страницы.
      </p>
      <OperationsSubNav />

      {reports.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-white/10 bg-white/5 px-4 py-8 text-center text-sm text-slate-500">
          Пока нет отчётов или Supabase недоступен из окружения портала.
        </p>
      ) : (
        <ul className="mt-8 space-y-4">
          {reports.map((r) => (
            <li
              key={r.id}
              className="rounded-2xl border border-white/10 bg-slate-950/60 p-4"
            >
              <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-widest text-slate-500">
                <span className="rounded-full border border-rose-400/30 bg-rose-500/10 px-2 py-0.5 text-rose-200">
                  {r.category}
                </span>
                <span>{r.status}</span>
                <span>{r.platform ?? "—"}</span>
                <span>v{r.app_version ?? "?"}</span>
                <span className="ml-auto font-mono text-slate-600">{r.id.slice(0, 8)}</span>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {new Date(r.created_at).toLocaleString("ru-RU")}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-white">{r.description}</p>
              {r.diagnostics ? (
                <pre className="mt-3 max-h-48 overflow-auto rounded-xl border border-white/5 bg-black/40 p-3 font-mono text-[10px] leading-relaxed text-slate-400">
                  {JSON.stringify(r.diagnostics, null, 2)}
                </pre>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
