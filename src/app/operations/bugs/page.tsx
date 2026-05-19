import type { Metadata } from "next";
import { OperationsSubNav } from "@/components/operations/ExecutionAuditPanels";
import { OperationsBugAlertsStatus } from "@/components/operations/OperationsBugAlertsStatus";
import { OperationsBugReportsLive } from "@/components/operations/OperationsBugReportsLive";
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
        Сообщения из приложения с категорией, описанием и полным журналом диагностики. Список
        обновляется автоматически каждые 45 секунд; можно включить уведомления в браузере.
      </p>
      <OperationsSubNav />
      <OperationsBugAlertsStatus />

      {reports.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-white/10 bg-white/5 px-4 py-8 text-center text-sm text-slate-500">
          Пока нет отчётов или Supabase недоступен из окружения портала.
        </p>
      ) : (
        <OperationsBugReportsLive initial={reports} />
      )}
    </div>
  );
}
