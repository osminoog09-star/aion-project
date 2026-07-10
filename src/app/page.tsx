import type { Metadata } from "next";
import Link from "next/link";
import codexStatus from "@/content/codex-work-status.json";
import apkManifest from "@/../public/apk-manifest.preview.json";
import { getEcosystemStatus } from "@/lib/ecosystem-data";
import { ecosystemRoutes } from "@/lib/ecosystem-routes";

export const metadata: Metadata = {
  title: "AION Driver — считает деньги за рулём Bolt",
  description:
    "AION Driver — приложение для водителя Bolt. Смена, доход, топливо, прибыль, история, карта. Здесь видно, что готово и что в работе.",
};

const CORE = ["Смена", "Доход", "Топливо", "Прибыль", "История", "Карта"];

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
    text: "Маршрут смены на карте, остановки и итоги прошлых дней в одном месте.",
  },
  {
    icon: "06",
    title: "Тихие обновления",
    text: "Новые версии прилетают по интернету — переустанавливать ничего не нужно.",
  },
] as const;

// Короткий срез плана. Полный — на странице «План».
const planStrip = [
  { n: "0", title: "Стабильность и чистота", state: "в работе", tone: "text-cyan-300", dot: "bg-cyan-400" },
  { n: "1", title: "Смена и деньги", state: "дальше", tone: "text-slate-300", dot: "bg-slate-500" },
  { n: "2", title: "Карта и маршрут", state: "дальше", tone: "text-slate-300", dot: "bg-slate-500" },
  { n: "3", title: "Навигатор для Bolt", state: "дальше", tone: "text-slate-300", dot: "bg-slate-500" },
] as const;

export default async function HomePage() {
  const eco = await getEcosystemStatus();
  const downloadUrl = codexStatus.latestRun?.url ?? ecosystemRoutes.releases;

  return (
    <div>
      {/* Hero — приложение для водителя Bolt */}
      <section className="aion-hero-glow border-b border-white/10">
        <div className="mx-auto max-w-4xl px-4 py-16 md:px-6 md:py-24">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300/90">
            AION Driver · для водителя Bolt
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight text-white md:text-5xl lg:text-6xl">
            Считает твои деньги
            <br />
            за рулём <span className="aion-gradient-text">Bolt</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-slate-400 md:text-lg">
            Одно приложение для смены, дохода, топлива и настоящей прибыли. Без таблиц и ручного
            ввода — просто работай, а AION ведёт учёт.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {CORE.map((c) => (
              <span
                key={c}
                className="rounded-full border border-white/15 px-3 py-1 text-xs font-medium text-slate-200"
              >
                {c}
              </span>
            ))}
          </div>
          <div className="mt-9 flex flex-wrap gap-3">
            <a
              href={downloadUrl}
              className="rounded-lg bg-cyan-400 px-6 py-3 text-sm font-semibold text-black transition hover:bg-cyan-300"
            >
              Скачать Driver
            </a>
            <Link
              href={ecosystemRoutes.roadmap}
              className="rounded-lg border border-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/5"
            >
              Посмотреть план
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-400">
            <span className="inline-flex items-center gap-2 font-medium text-emerald-200">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              Разработка идёт каждый день
            </span>
            <span>
              Для Android · версия {apkManifest.runtimeVersion} · сборка {apkManifest.buildNumber}
            </span>
            <span>Обновлено {eco.lastUpdated}</span>
          </div>
        </div>
      </section>

      {/* Что умеет Driver */}
      <section className="border-b border-white/10 bg-[#0a0d0f]">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-20">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300/90">
              Что готово
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white md:text-3xl">Что умеет Driver</h2>
            <p className="mt-3 text-base leading-7 text-slate-400">
              Никаких таблиц и ручного ввода. Приложение само ведёт учёт смены, а ты просто работаешь.
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
        </div>
      </section>

      {/* Куда движемся — короткий план */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300/90">
              Куда движемся
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white md:text-3xl">
              Одно до конца — потом следующее
            </h2>
            <p className="mt-3 text-base leading-7 text-slate-400">
              Никакого бега по сотне недоделок. Каждый этап доводится до железной надёжности.
            </p>
          </div>
          <Link
            href={ecosystemRoutes.roadmap}
            className="text-sm font-medium text-cyan-300 transition hover:text-cyan-200"
          >
            Полный план →
          </Link>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-4">
          {planStrip.map((s) => (
            <article
              key={s.n}
              className="aion-card rounded-lg border border-white/10 bg-white/[0.02] p-6"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-slate-400" aria-hidden="true">
                  Этап {s.n}
                </span>
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${s.tone}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                  {s.state}
                </span>
              </div>
              <h3 className="mt-5 text-base font-semibold text-white">{s.title}</h3>
            </article>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/10 bg-[#0a0d0f]">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-14 md:flex-row md:items-center md:px-6">
          <div>
            <h2 className="text-2xl font-semibold text-white">Попробовать Driver прямо сейчас</h2>
            <p className="mt-2 text-sm text-slate-400">
              Последняя версия для Android · сборка {apkManifest.buildNumber}.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href={downloadUrl}
              className="rounded-lg bg-cyan-400 px-6 py-3 text-sm font-semibold text-black transition hover:bg-cyan-300"
            >
              Скачать Driver
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
