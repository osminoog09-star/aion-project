import type { Metadata } from "next";
import Link from "next/link";
import { getEcosystemStatus } from "@/lib/ecosystem-data";
import { averageReadiness } from "@/lib/readiness";
import { ecosystemRoutes } from "@/lib/ecosystem-routes";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "План развития AION — что готово и что впереди",
  description:
    "Понятный план развития AION: четыре этапа, готовность по направлениям и что в работе прямо сейчас.",
};

const readinessRows = [
  { key: "mobile", label: "Приложение Driver" },
  { key: "backgroundDrive", label: "Подсчёт в фоне" },
  { key: "ocr", label: "Распознавание чеков" },
  { key: "sync", label: "Синхронизация" },
  { key: "cloud", label: "Облако" },
  { key: "webPortal", label: "Этот сайт" },
] as const;

const stages = [
  {
    n: "01",
    title: "Базовое приложение",
    state: "готово",
    tone: "text-emerald-300",
    dot: "bg-emerald-400",
    text: "Смена, GPS-километраж, чеки топлива и подсчёт прибыли работают. Версию можно скачать и пользоваться.",
  },
  {
    n: "02",
    title: "Надёжность",
    state: "сейчас",
    tone: "text-cyan-300",
    dot: "bg-cyan-400",
    text: "Приложение не теряет данные, если пропала связь, телефон ушёл в сон или закрылось приложение. Точный подсчёт в фоне.",
  },
  {
    n: "03",
    title: "Умная аналитика",
    state: "дальше",
    tone: "text-amber-300",
    dot: "bg-amber-400",
    text: "История смен, реальные расходы и понятные подсказки: где и когда выгоднее работать. Только на ваших настоящих данных.",
  },
  {
    n: "04",
    title: "Карты и топливо",
    state: "позже",
    tone: "text-violet-300",
    dot: "bg-violet-400",
    text: "Глубокий разбор поездок и расхода топлива по маршруту. Начнём, когда накопится достаточно реальных данных.",
  },
] as const;

const nowDoing = [
  "Подсчёт километров продолжается, даже когда телефон в кармане",
  "Данные смены не теряются при потере связи",
  "Чеки топлива распознаются точнее",
] as const;

export default async function RoadmapPage() {
  const eco = await getEcosystemStatus();
  const progress = averageReadiness(eco.readiness);

  return (
    <div>
      <section className="aion-hero-glow border-b border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300/90">
            AION · план развития
          </p>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-white md:text-5xl">
            Куда движется проект
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-slate-400 md:text-lg">
            Простой и честный план: что уже готово, над чем работаем сейчас и что будет дальше.
            Без обещаний конкретных дат — только реальный порядок шагов.
          </p>
          <div className="mt-9 flex items-end gap-4">
            <div>
              <p className="text-6xl font-semibold text-white">
                {progress}
                <span className="text-2xl text-emerald-300">%</span>
              </p>
              <p className="mt-1 text-sm text-slate-500">общая готовность</p>
            </div>
            <div
              className="mb-1 h-2.5 w-48 overflow-hidden rounded bg-white/10"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Общая готовность проекта"
            >
              <div
                className="h-full rounded bg-emerald-400"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-violet-300/90">
          Путь до результата
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-white md:text-3xl">Четыре понятных этапа</h2>
        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          {stages.map((s) => (
            <article
              key={s.n}
              className="aion-card rounded-lg border border-white/10 bg-white/[0.02] p-6"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-slate-600">{s.n}</span>
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${s.tone}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                  {s.state}
                </span>
              </div>
              <h3 className="mt-5 text-lg font-semibold text-white">{s.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{s.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#0a0d0f]">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:px-6 md:py-20 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300/90">
              Где проект сейчас
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white md:text-3xl">
              Готовность по направлениям
            </h2>
            <div className="mt-8 grid gap-y-6">
              {readinessRows.map((row) => {
                const value = eco.readiness[row.key] ?? 0;
                return (
                  <div key={row.key}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-slate-200">{row.label}</span>
                      <span className="font-mono text-xs text-slate-500">{value}%</span>
                    </div>
                    <div
                      className="h-2.5 w-full overflow-hidden rounded bg-white/10"
                      role="progressbar"
                      aria-valuenow={Math.max(0, Math.min(100, value))}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${row.label}: готовность`}
                    >
                      <div
                        className="h-full rounded bg-cyan-400"
                        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300/90">
              Сейчас в работе
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white md:text-3xl">Над чем работаем</h2>
            <ul className="mt-8 space-y-4">
              {nowDoing.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-6 text-slate-300">
                  <span className="mt-0.5 text-cyan-400" aria-hidden="true">
                    →
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-8 text-sm text-slate-500">
              Нужны технические подробности и журнал работ?{" "}
              <Link
                href={ecosystemRoutes.operations}
                className="text-cyan-300 underline-offset-2 hover:underline"
              >
                Раздел «Операции»
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
          Планируется
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-white md:text-3xl">Идеи на будущее</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <article className="aion-card rounded-lg border border-white/10 bg-white/[0.02] p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-white">Taxi Plan — где таксовать</h3>
              <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-[11px] font-semibold text-slate-400">
                в плане
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              План на неделю и месяц для водителя: где и когда выгоднее работать в Пярну — горячие
              зоны, прогноз спроса, городские события, погода и праздники. Подсказки — только на
              реальных данных смен, без выдуманных цифр.
            </p>
          </article>
          <article className="aion-card rounded-lg border border-white/10 bg-white/[0.02] p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-white">Умные маршруты</h3>
              <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-[11px] font-semibold text-slate-400">
                спайк
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Привязка трека смены к реальным дорогам — точная дистанция по маршруту и основа для
              предиктивного расхода топлива. Сейчас на этапе проектирования, без движка, только на
              реальных треках.
            </p>
          </article>
        </div>
      </section>
    </div>
  );
}
