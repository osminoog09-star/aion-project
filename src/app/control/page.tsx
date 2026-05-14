import type { Metadata } from "next";
import Link from "next/link";
import { AionWebEntity } from "@/components/AionWebEntity";
import { getEcosystemStatus } from "@/lib/ecosystem-data";
import { averageReadiness } from "@/lib/readiness";

export const metadata: Metadata = {
  title: "AION Control — центр управления экосистемой",
  description: "Сводка состояния; вход в аккаунт и live-данные устройств подключаются к Supabase на следующем этапе.",
};

export default function ControlPage() {
  const eco = getEcosystemStatus();
  const avg = averageReadiness(eco.readiness);

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20">
      <h1 className="text-3xl font-bold text-white md:text-4xl">Control center</h1>
      <p className="mt-4 max-w-3xl text-slate-400">
        Операционный слой AION: устройства, релизы, OTA/APK, диагностика синка. Сейчас отображаются{" "}
        <strong className="text-slate-200">публичные данные из репозитория</strong> (без фиктивных счётчиков).
        Авторизация и привязка к вашему Supabase-проекту — следующий шаг разработки.
      </p>

      <div className="mt-12 flex flex-col items-start gap-10 md:flex-row md:items-center">
        <AionWebEntity readinessAvg={avg} />
        <div className="flex-1 space-y-4">
          <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/95">
            Аккаунт: вход и сессии на этом сайте ещё не подключены — не показываем пустой «фейковый» дашборд устройств.
          </div>
          <p className="text-sm text-slate-500">
            Пока используйте диагностику внутри AION Driver и раздел{" "}
            <Link href="/releases" className="text-cyan-400 hover:underline">
              Релизы
            </Link>{" "}
            здесь.
          </p>
        </div>
      </div>

      <section className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(eco.readiness).map(([k, v]) => (
          <div key={k} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{k}</p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-white">{v}%</p>
          </div>
        ))}
      </section>
    </div>
  );
}
