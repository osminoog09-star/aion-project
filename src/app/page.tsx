import type { Metadata } from "next";
import Link from "next/link";
import codexStatus from "@/content/codex-work-status.json";
import apkManifest from "@/../public/apk-manifest.preview.json";
import { AionWebEntity } from "@/components/AionWebEntity";
import { getEcosystemStatus } from "@/lib/ecosystem-data";
import { ecosystemRoutes } from "@/lib/ecosystem-routes";
import { averageReadiness } from "@/lib/readiness";

export const metadata: Metadata = {
  title: "AION — платформа из нескольких продуктов",
  description:
    "AION — это платформа из модулей под одним брендом. Первый готовый модуль — Driver, приложение для водителя. Остальные в разработке.",
};

type ModuleState = "ready" | "building" | "planned";

const stateBadge: Record<ModuleState, { label: string; cls: string }> = {
  ready: { label: "Работает", cls: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" },
  building: { label: "В разработке", cls: "border-amber-400/30 bg-amber-400/10 text-amber-200" },
  planned: { label: "В планах", cls: "border-white/15 bg-white/5 text-slate-400" },
};

const modules: {
  code: string;
  name: string;
  href: string;
  state: ModuleState;
  text: string;
}[] = [
  {
    code: "01",
    name: "Driver",
    href: ecosystemRoutes.aionProject,
    state: "ready",
    text: "Приложение для водителя: смены, километры, топливо по чекам и реальная прибыль.",
  },
  {
    code: "02",
    name: "AI",
    href: ecosystemRoutes.ai,
    state: "planned",
    text: "Общий умный слой платформы: подсказки и помощь во всех модулях.",
  },
  {
    code: "03",
    name: "Core",
    href: ecosystemRoutes.core,
    state: "planned",
    text: "Общая основа для всех модулей: вход, настройки и единые сервисы.",
  },
  {
    code: "04",
    name: "Studio",
    href: ecosystemRoutes.studio,
    state: "building",
    text: "Инструменты для контента и настройки — отдельно от приложений.",
  },
  {
    code: "05",
    name: "Link",
    href: ecosystemRoutes.link,
    state: "planned",
    text: "Связь между телефоном и другими устройствами, общие очереди задач.",
  },
];

const driverPoints = [
  "Считает километры по GPS и время за рулём",
  "Распознаёт чеки топлива прямо с фото",
  "Показывает настоящую прибыль — за час и за километр",
  "Продолжает считать, даже когда телефон в кармане",
] as const;

export default async function HomePage() {
  const eco = await getEcosystemStatus();
  const progress = averageReadiness(eco.readiness);
  const downloadUrl = codexStatus.latestRun?.url ?? ecosystemRoutes.releases;

  return (
    <div>
      {/* Hero */}
      <section className="aion-hero-glow border-b border-white/10">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:px-6 md:py-24 lg:grid-cols-[1.25fr_0.75fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300/90">
              AION · платформа
            </p>
            <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight text-white md:text-5xl lg:text-6xl">
              Одна платформа —
              <br />
              <span className="aion-gradient-text">много продуктов</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-400 md:text-lg">
              AION — это набор приложений под одним брендом. Каждый модуль решает свою задачу.
              Первый готовый — <span className="text-slate-200">Driver</span>, приложение для
              водителя. Остальные модули в разработке.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href={ecosystemRoutes.aionProject}
                className="rounded-lg bg-cyan-400 px-6 py-3 text-sm font-semibold text-black transition hover:bg-cyan-300"
              >
                Открыть Driver
              </Link>
              <Link
                href="#modules"
                className="rounded-lg border border-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/5"
              >
                Все модули ↓
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
              <span className="inline-flex items-center gap-2 font-medium text-emerald-200">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                Разработка идёт каждый день
              </span>
              <span>Обновлено {eco.lastUpdated}</span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-5">
            <AionWebEntity readinessAvg={progress} />
            <div className="text-center">
              <p className="text-6xl font-semibold text-white">
                {progress}
                <span className="text-2xl text-emerald-300">%</span>
              </p>
              <p className="mt-1 text-sm text-slate-500">общая готовность платформы</p>
            </div>
          </div>
        </div>
      </section>

      {/* Модули */}
      <section id="modules" className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-20">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300/90">
            Модули платформы
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-white md:text-3xl">
            Из чего состоит AION
          </h2>
          <p className="mt-3 text-base leading-7 text-slate-400">
            AION строится по частям. Сейчас работает один модуль — Driver. Остальные появятся по мере
            готовности, мы их не выдумываем заранее.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((m) => {
            const badge = stateBadge[m.state];
            const isReady = m.state === "ready";
            return (
              <Link
                key={m.name}
                href={m.href}
                className={`aion-card group flex flex-col rounded-lg border bg-white/[0.02] p-6 ${
                  isReady ? "border-cyan-400/40" : "border-white/10"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-slate-600">{m.code}</span>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${badge.cls}`}
                  >
                    {badge.label}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-white">{m.name}</h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-slate-400">{m.text}</p>
                <span className="mt-4 text-xs font-medium text-cyan-300/90 opacity-0 transition group-hover:opacity-100">
                  Открыть →
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Driver — первый готовый модуль */}
      <section className="border-y border-white/10 bg-[#0a0d0f]">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:px-6 md:py-20 lg:grid-cols-2">
          <div>
            <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-200">
              Готовый модуль
            </span>
            <h2 className="mt-4 text-2xl font-semibold text-white md:text-3xl">AION Driver</h2>
            <p className="mt-3 text-base leading-7 text-slate-400">
              Первый рабочий продукт платформы — приложение для водителя. Ведёт смену за вас, чтобы
              вы видели реальный итог без таблиц и калькулятора.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href={downloadUrl}
                className="rounded-lg bg-cyan-400 px-6 py-3 text-sm font-semibold text-black transition hover:bg-cyan-300"
              >
                Скачать приложение
              </a>
              <Link
                href={ecosystemRoutes.aionProject}
                className="rounded-lg border border-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/5"
              >
                Подробнее
              </Link>
            </div>
            <p className="mt-5 text-xs text-slate-500">
              Версия {apkManifest.runtimeVersion} · сборка {apkManifest.buildNumber} · Android
            </p>
          </div>

          <ul className="grid content-center gap-4">
            {driverPoints.map((p) => (
              <li key={p} className="flex gap-3 text-sm leading-6 text-slate-300">
                <span className="mt-0.5 text-cyan-400" aria-hidden="true">
                  ✓
                </span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Прогресс */}
      <section className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-14 md:flex-row md:items-center md:px-6">
        <div>
          <h2 className="text-2xl font-semibold text-white">Куда движется AION</h2>
          <p className="mt-2 text-sm text-slate-400">
            Платформа готова на {progress}%. Что сделано и что впереди — на странице плана.
          </p>
        </div>
        <Link
          href={ecosystemRoutes.roadmap}
          className="rounded-lg border border-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/5"
        >
          Посмотреть план развития
        </Link>
      </section>
    </div>
  );
}
