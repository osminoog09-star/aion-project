import Link from "next/link";
import { AionWebEntity } from "@/components/AionWebEntity";
import { getEcosystemStatus } from "@/lib/ecosystem-data";
import { averageReadiness } from "@/lib/readiness";
import { ecosystemRoutes } from "@/lib/ecosystem-routes";

export default async function HomePage() {
  const eco = await getEcosystemStatus();
  const avg = averageReadiness(eco.readiness);

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20">
      <p className="text-center text-[11px] font-semibold uppercase tracking-[0.45em] text-cyan-400/90">
        AI infrastructure · Realtime ecosystem · Cloud-native
      </p>
      <h1 className="mt-4 text-center text-3xl font-bold tracking-tight text-white md:text-5xl md:leading-tight">
        AION — экосистемная AI-платформа
      </h1>
      <p className="mx-auto mt-5 max-w-2xl text-center text-base leading-relaxed text-slate-400 md:text-lg">
        Модульная realtime-инфраструктура: облако, мультиустройство, операционный портал и интеллектуальные операции.
        Первый активный модуль — <strong className="text-slate-200">AION Driver</strong> (профессиональный транспортный
        кокпит; не определяет границы всей экосистемы).
      </p>

      <div className="mt-12 flex flex-col items-center gap-10 md:mt-16 md:flex-row md:justify-center md:gap-16">
        <AionWebEntity readinessAvg={avg} />
        <div className="max-w-md space-y-4 text-sm leading-relaxed text-slate-400">
          <p>
            Средняя готовность по направлениям readiness (репозиторий,{" "}
            <time dateTime={eco.lastUpdated}>{eco.lastUpdated}</time>):{" "}
            <strong className="text-cyan-300">{avg}%</strong>
          </p>
          <p>{eco.methodology}</p>
          <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-center md:justify-start">
            <Link
              href={ecosystemRoutes.aionProject}
              className="rounded-xl bg-cyan-500/15 px-5 py-3 text-center text-sm font-semibold text-cyan-200 ring-1 ring-cyan-400/35 transition hover:bg-cyan-500/25"
            >
              AION Driver
            </Link>
            <Link
              href="/status"
              className="rounded-xl bg-white/5 px-5 py-3 text-center text-sm font-semibold text-slate-200 ring-1 ring-white/10 transition hover:bg-white/10"
            >
              Статус
            </Link>
            <Link
              href="/roadmap"
              className="rounded-xl bg-white/5 px-5 py-3 text-center text-sm font-semibold text-slate-200 ring-1 ring-white/10 transition hover:bg-white/10"
            >
              Roadmap
            </Link>
            <Link
              href="/control"
              className="rounded-xl bg-violet-500/10 px-5 py-3 text-center text-sm font-semibold text-violet-200 ring-1 ring-violet-400/30 transition hover:bg-violet-500/20"
            >
              Control center
            </Link>
          </div>
        </div>
      </div>

      <section className="mt-20 grid gap-6 border-t border-white/10 pt-14 md:grid-cols-3">
        <div className="rounded-2xl bg-white/[0.03] p-6 ring-1 ring-white/10">
          <h2 className="text-sm font-bold uppercase tracking-widest text-violet-400/90">Платформа</h2>
          <p className="mt-3 text-sm text-slate-400">
            Облако, realtime, синхронизация, очереди и операции — сквозная инфраструктура для всех модулей; портал
            отражает состояние экосистемы.
          </p>
        </div>
        <div className="rounded-2xl bg-white/[0.03] p-6 ring-1 ring-white/10">
          <h2 className="text-sm font-bold uppercase tracking-widest text-cyan-400/90">AI · модули</h2>
          <p className="mt-3 text-sm text-slate-400">
            AION Entity и AI-слой поверх диагностики и обновлений. Модули: Driver, Link, Core — расширяемая сетка
            продуктов.
          </p>
        </div>
        <div className="rounded-2xl bg-white/[0.03] p-6 ring-1 ring-white/10">
          <h2 className="text-sm font-bold uppercase tracking-widest text-emerald-400/90">Релизы</h2>
          <p className="mt-3 text-sm text-slate-400">
            Каналы preview/production, OTA vs APK, артефакты модулей — единая политика на странице «Релизы».
          </p>
        </div>
      </section>
    </div>
  );
}
