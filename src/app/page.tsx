import type { Metadata } from "next";
import Link from "next/link";
import codexStatus from "@/content/codex-work-status.json";
import apkManifest from "@/../public/apk-manifest.preview.json";
import { AionWebEntity } from "@/components/AionWebEntity";
import { getEcosystemStatus } from "@/lib/ecosystem-data";
import { ecosystemRoutes } from "@/lib/ecosystem-routes";
import { averageReadiness } from "@/lib/readiness";

export const metadata: Metadata = {
  title: "AION — помощник водителя и центр экосистемы",
  description:
    "AION Driver считает смены, топливо и реальную прибыль за рулём. Здесь видно, что уже готово и что в работе.",
};

const readinessRows = [
  { key: "mobile", label: "Приложение Driver" },
  { key: "backgroundDrive", label: "Подсчёт в фоне" },
  { key: "ocr", label: "Распознавание чеков" },
  { key: "sync", label: "Синхронизация" },
  { key: "cloud", label: "Облако" },
  { key: "webPortal", label: "Этот сайт" },
] as const;

const features = [
  {
    icon: "01",
    title: "Учёт смены",
    text: "Начали смену — приложение считает километры по GPS, время за рулём и заработок.",
  },
  {
    icon: "02",
    title: "Чеки топлива",
    text: "Сфотографировали чек — литры и сумма впишутся сами, без ручного ввода.",
  },
  {
    icon: "03",
    title: "Настоящая прибыль",
    text: "Доход минус топливо и расходы. Видно, сколько вышло за час и за километр.",
  },
  {
    icon: "04",
    title: "Работает в фоне",
    text: "Считает дорогу, даже когда телефон в кармане и экран выключен.",
  },
  {
    icon: "05",
    title: "Карта и история",
    text: "Маршруты смен, остановки и аналитика прошлых дней в одном месте.",
  },
  {
    icon: "06",
    title: "Тихие обновления",
    text: "Новые версии прилетают по интернету — переустанавливать ничего не нужно.",
  },
] as const;

const stages = [
  {
    n: "01",
    title: "Базовое приложение",
    text: "Смена, GPS, чеки топлива и прибыль уже работают.",
    state: "готово",
    tone: "text-emerald-300",
    dot: "bg-emerald-400",
  },
  {
    n: "02",
    title: "Надёжность",
    text: "Не теряет данные, если пропала связь или телефон ушёл в сон.",
    state: "сейчас",
    tone: "text-cyan-300",
    dot: "bg-cyan-400",
  },
  {
    n: "03",
    title: "Умная аналитика",
    text: "История смен, реальные расходы и понятные подсказки.",
    state: "дальше",
    tone: "text-amber-300",
    dot: "bg-amber-400",
  },
  {
    n: "04",
    title: "Карты и топливо",
    text: "Глубокая экономика поездок — только на реальных данных.",
    state: "позже",
    tone: "text-violet-300",
    dot: "bg-violet-400",
  },
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
              AION · экосистема
            </p>
            <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight text-white md:text-5xl lg:text-6xl">
              Помощник водителя,
              <br />
              который <span className="aion-gradient-text">считает деньги</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-400 md:text-lg">
              Главный продукт экосистемы — приложение <span className="text-slate-200">AION Driver</span>.
              Оно считает смены, топливо и реальную прибыль за рулём. На этом сайте видно, что уже
              готово и что в работе.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a
                href={downloadUrl}
                className="rounded-lg bg-cyan-400 px-6 py-3 text-sm font-semibold text-black transition hover:bg-cyan-300"
              >
                Скачать приложение
              </a>
              <Link
                href="#features"
                className="rounded-lg border border-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/5"
              >
                Что внутри →
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
              <span className="inline-flex items-center gap-2 font-medium text-emerald-200">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                Разработка идёт каждый день
              </span>
              <span>
                Версия {apkManifest.runtimeVersion} · сборка {apkManifest.buildNumber}
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
              <p className="mt-1 text-sm text-slate-500">общая готовность</p>
            </div>
          </div>
        </div>
      </section>

      {/* Что умеет */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-20">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300/90">
            Что умеет приложение
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-white md:text-3xl">
            Всё, что нужно за смену — в одном экране
          </h2>
          <p className="mt-3 text-base leading-7 text-slate-400">
            Никаких таблиц и ручного ввода. Приложение само ведёт учёт, а вы просто работаете.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <article
              key={f.title}
              className="aion-card rounded-lg border border-white/10 bg-white/[0.02] p-6"
            >
              <div className="font-mono text-xs text-cyan-300" aria-hidden="true">
                {f.icon}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-white">{f.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{f.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Готовность направлений */}
      <section className="border-y border-white/10 bg-[#0a0d0f]">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300/90">
                Где проект сейчас
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-white md:text-3xl">
                Готовность по направлениям
              </h2>
            </div>
            <Link
              href={ecosystemRoutes.roadmap}
              className="text-sm font-medium text-cyan-300 transition hover:text-cyan-200"
            >
              Полный план развития →
            </Link>
          </div>

          <div className="mt-10 grid gap-x-12 gap-y-7 md:grid-cols-2">
            {readinessRows.map((row) => {
              const value = eco.readiness[row.key] ?? 0;
              return (
                <div key={row.key}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-slate-200">{row.label}</span>
                    <span className="font-mono text-xs text-slate-500">{value}%</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded bg-white/10">
                    <div
                      className="h-full rounded bg-cyan-400"
                      style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-7 max-w-3xl text-xs leading-5 text-slate-600">
            Проценты — честная оценка готовности к ежедневному использованию: код, удобство,
            облако и проверки. Это не обещание конкретной даты.
          </p>
        </div>
      </section>

      {/* Четыре этапа */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-violet-300/90">
          Путь до результата
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-white md:text-3xl">Четыре понятных этапа</h2>
        <div className="mt-10 grid gap-4 lg:grid-cols-4">
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
              <h3 className="mt-5 text-base font-semibold text-white">{s.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{s.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/10 bg-[#0a0d0f]">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-14 md:flex-row md:items-center md:px-6">
          <div>
            <h2 className="text-2xl font-semibold text-white">Попробовать прямо сейчас</h2>
            <p className="mt-2 text-sm text-slate-400">
              Последняя версия для Android · сборка {apkManifest.buildNumber}.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href={downloadUrl}
              className="rounded-lg bg-cyan-400 px-6 py-3 text-sm font-semibold text-black transition hover:bg-cyan-300"
            >
              Скачать приложение
            </a>
            <Link
              href={ecosystemRoutes.roadmap}
              className="rounded-lg border border-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/5"
            >
              Посмотреть план
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
