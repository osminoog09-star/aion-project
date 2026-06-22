import type { Metadata } from "next";
import Link from "next/link";
import codexStatus from "@/content/codex-work-status.json";
import apkManifest from "@/../public/apk-manifest.preview.json";
import { getEcosystemStatus } from "@/lib/ecosystem-data";
import { ecosystemRoutes } from "@/lib/ecosystem-routes";
import { averageReadiness } from "@/lib/readiness";
import { getStrategicPriorities } from "@/lib/strategic-priorities";

export const metadata: Metadata = {
  title: "AION Project — прогресс и текущее состояние",
  description:
    "Понятная сводка AION Project: общий прогресс, активная работа, оставшиеся этапы, Driver и релизы.",
};

const readinessRows = [
  { key: "mobile", label: "Driver", color: "bg-cyan-400" },
  { key: "backgroundDrive", label: "Фоновая смена", color: "bg-emerald-400" },
  { key: "ocr", label: "OCR", color: "bg-amber-400" },
  { key: "sync", label: "Синхронизация", color: "bg-sky-400" },
  { key: "cloud", label: "Облако", color: "bg-rose-400" },
  { key: "webPortal", label: "Портал", color: "bg-violet-400" },
] as const;

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded bg-white/10" aria-hidden="true">
      <div className={`h-full rounded ${color}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

function SummaryMetric({ label, value, tone = "text-white" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${tone}`}>{value}</p>
    </div>
  );
}

const levelPresentation: Record<string, { label: string; className: string }> = {
  critical: { label: "P0", className: "border-rose-400/30 bg-rose-400/10 text-rose-200" },
  high: { label: "P1", className: "border-amber-400/30 bg-amber-400/10 text-amber-200" },
  medium: { label: "P2", className: "border-cyan-400/30 bg-cyan-400/10 text-cyan-200" },
  strategic: { label: "STR", className: "border-violet-400/30 bg-violet-400/10 text-violet-200" },
  low: { label: "P3", className: "border-white/15 bg-white/5 text-slate-300" },
};

export default async function HomePage() {
  const [eco, priorities] = await Promise.all([getEcosystemStatus(), getStrategicPriorities()]);
  const progress = averageReadiness(eco.readiness);
  const remaining = Math.max(0, 100 - progress);
  const statusCounts = priorities.priorities.reduce<Record<string, number>>((acc, item) => {
    const status = String(item.status);
    acc[status] = (acc[status] ?? 0) + 1;
    return acc;
  }, {});
  const activeCount = (statusCounts.in_progress ?? 0) + (statusCounts.actionable ?? 0);
  const queuedCount = (statusCounts.not_started ?? 0) + (statusCounts.roadmap_only ?? 0);
  const activeLevelOrder: Record<string, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    strategic: 3,
    low: 4,
  };
  const activePriorities = priorities.priorities
    .filter((item) => item.status === "in_progress" || String(item.status) === "actionable")
    .sort((a, b) => (activeLevelOrder[a.level] ?? 9) - (activeLevelOrder[b.level] ?? 9))
    .slice(0, 4);

  return (
    <div>
      <section className="border-b border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[11px] font-semibold uppercase text-cyan-300">AION Project · состояние проекта</p>
              <h1 className="mt-3 text-3xl font-semibold text-white md:text-4xl">Что готово и сколько осталось</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 md:text-base">
                Главный активный продукт — AION Driver. Здесь собраны текущая работа, реальная готовность
                направлений, ближайшие этапы и последний доступный APK.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={ecosystemRoutes.aionProject}
                className="rounded-md bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-cyan-300"
              >
                Открыть Driver
              </Link>
              <Link
                href={ecosystemRoutes.operations}
                className="rounded-md border border-white/15 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/5"
              >
                Смотреть работу →
              </Link>
            </div>
          </div>

          <div className="mt-9 border-y border-white/10 py-6">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs">
              <span className="inline-flex items-center gap-2 font-medium text-emerald-200">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Автономная разработка активна
              </span>
              <span className="text-slate-600">Обновлено {eco.lastUpdated}</span>
              <span className="text-slate-600">APK build {apkManifest.buildNumber}</span>
            </div>

            <div className="mt-6 grid gap-7 lg:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.6fr)] lg:items-end">
              <div>
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase text-slate-500">Общая готовность</p>
                    <p className="mt-1 text-5xl font-semibold text-white md:text-6xl">{progress}<span className="text-2xl text-emerald-300">%</span></p>
                  </div>
                  <p className="pb-1 text-right text-sm text-slate-400"><span className="font-semibold text-amber-300">{remaining}%</span><br />Осталось</p>
                </div>
                <div className="mt-4 h-4 overflow-hidden rounded bg-white/10" role="progressbar" aria-label="Общая готовность AION" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                  <div className="h-full rounded bg-emerald-400" style={{ width: `${progress}%` }} />
                </div>
                <p className="mt-2 text-xs text-slate-600">Оценка учитывает код, UX, облако, тесты и граничные случаи.</p>
              </div>
              <div className="grid grid-cols-3 gap-4 border-t border-white/10 pt-5 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0">
                <SummaryMetric label="В работе" value={String(activeCount)} tone="text-cyan-200" />
                <SummaryMetric label="В очереди" value={String(queuedCount)} tone="text-amber-200" />
                <SummaryMetric label="Блокеры" value={String(statusCounts.blocked ?? 0)} tone="text-rose-200" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#0b0e10]">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:px-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase text-emerald-300">Сейчас</p>
                <h2 className="mt-2 text-xl font-semibold text-white">{codexStatus.currentStatus}</h2>
              </div>
              <span className="rounded border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-xs text-emerald-200">
                работа продолжается
              </span>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-400">{codexStatus.currentFocus}</p>

            <div className="mt-6 divide-y divide-white/10 border-y border-white/10">
              {activePriorities.map((item) => {
                const level = levelPresentation[item.level] ?? levelPresentation.low;
                return (
                <div key={item.id} className="grid gap-2 py-4 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
                  <div className="flex items-start gap-3">
                    <span className={`mt-0.5 shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold ${level.className}`}>{level.label}</span>
                    <p className="text-sm font-medium text-slate-200">{item.title}</p>
                  </div>
                  <p className="text-xs leading-5 text-slate-500">{item.nextAction}</p>
                </div>
                );
              })}
            </div>
          </div>

          <div className="border-l border-white/10 pl-0 lg:pl-8">
            <p className="text-[11px] font-semibold uppercase text-slate-500">Последний Driver build</p>
            <p className="mt-2 text-xl font-semibold text-white">{codexStatus.latestRun.label}</p>
            <p className="mt-2 text-sm text-slate-400">GPS High · continuous FGS · runtime {apkManifest.runtimeVersion}</p>
            <a
              href={codexStatus.latestRun.url}
              className="mt-5 inline-flex rounded-md border border-cyan-400/30 px-4 py-2.5 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/10"
            >
              Скачать APK →
            </a>

            <div className="mt-8 border-t border-white/10 pt-6">
              <p className="text-[11px] font-semibold uppercase text-slate-500">Следующий практический шаг</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">{priorities.nextImplementationTarget}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 md:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase text-amber-300">Прогресс направлений</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Где проект находится сейчас</h2>
          </div>
          <Link href={ecosystemRoutes.roadmap} className="text-sm font-medium text-cyan-300 hover:text-cyan-200">
            Полная дорожная карта →
          </Link>
        </div>

        <div className="mt-7 grid gap-x-10 gap-y-6 md:grid-cols-2">
          {readinessRows.map((row) => {
            const value = eco.readiness[row.key];
            return (
              <div key={row.key}>
                <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                  <span className="text-slate-300">{row.label}</span>
                  <span className="font-mono text-xs text-slate-500">{value}% · осталось {100 - value}%</span>
                </div>
                <ProgressBar value={value} color={row.color} />
              </div>
            );
          })}
        </div>
        <p className="mt-6 max-w-3xl text-xs leading-5 text-slate-600">
          Проценты — честная редакционная оценка готовности к продуктовой эксплуатации: код, UX, облако,
          тесты и граничные случаи. Это не обещание даты завершения.
        </p>
      </section>

      <section className="border-y border-white/10 bg-[#0b0e10]">
        <div className="mx-auto max-w-6xl px-4 py-12 md:px-6">
          <p className="text-[11px] font-semibold uppercase text-violet-300">Путь до результата</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Четыре понятных этапа</h2>
          <div className="mt-7 grid gap-3 lg:grid-cols-4">
            {[
              ["01", "Базовый Driver", "Смена, GPS, OCR, прибыль и preview APK работают.", "готово", "text-emerald-300"],
              ["02", "Надёжность runtime", "Background lifecycle, reconnect и cloud edge cases.", "сейчас", "text-cyan-300"],
              ["03", "Операционный интеллект", "История смен, реальные расходы и полезные рекомендации.", "далее", "text-amber-300"],
              ["04", "Maps & Fuel", "Классы километров и экономика только по накопленным данным.", "позже", "text-violet-300"],
            ].map(([number, title, detail, state, tone]) => (
              <article key={number} className="rounded-lg border border-white/10 bg-black/15 p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-xs text-slate-600">{number}</span>
                  <span className={`text-[11px] font-semibold uppercase ${tone}`}>{state}</span>
                </div>
                <h3 className="mt-5 text-base font-semibold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:px-6 lg:grid-cols-2">
        <div>
          <p className="text-[11px] font-semibold uppercase text-emerald-300">Недавно сделано</p>
          <ul className="mt-4 divide-y divide-white/10 border-y border-white/10">
            {codexStatus.completed.slice(0, 4).map((item) => (
              <li key={item} className="flex gap-3 py-3 text-sm leading-6 text-slate-400">
                <span className="text-emerald-400">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase text-amber-300">Что ещё осталось</p>
          <ul className="mt-4 divide-y divide-white/10 border-y border-white/10">
            {codexStatus.next.map((item) => (
              <li key={item} className="flex gap-3 py-3 text-sm leading-6 text-slate-400">
                <span className="text-amber-400">→</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex flex-wrap gap-3 text-sm">
            <Link href={ecosystemRoutes.operations} className="font-medium text-cyan-300 hover:text-cyan-200">
              Живая работа →
            </Link>
            <Link href={ecosystemRoutes.status} className="font-medium text-slate-400 hover:text-white">
              Технический статус →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
