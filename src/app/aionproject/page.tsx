import type { Metadata } from "next";
import Link from "next/link";
import apkManifest from "@/../public/apk-manifest.preview.json";
import codexStatus from "@/content/codex-work-status.json";
import { ecosystemRoutes } from "@/lib/ecosystem-routes";

export const metadata: Metadata = {
  title: "AION Driver — приложение для водителя",
  description:
    "AION Driver сам считает смену, километры, топливо по чекам и реальную прибыль. Скачайте последнюю версию для Android.",
  alternates: { canonical: ecosystemRoutes.aionProject },
};

const abilities = [
  {
    icon: "01",
    title: "Смена под контролем",
    text: "Нажали «начать смену» — приложение само считает километры по GPS, время за рулём и заработок.",
  },
  {
    icon: "02",
    title: "Чеки топлива без ручного ввода",
    text: "Сфотографировали чек с заправки — приложение распознаёт литры, цену и сумму и добавляет их в расходы.",
  },
  {
    icon: "03",
    title: "Видно настоящую прибыль",
    text: "Доход за вычетом топлива и расходов. Сразу понятно, сколько вы зарабатываете за час и за километр.",
  },
  {
    icon: "04",
    title: "Считает даже в фоне",
    text: "Можно убрать телефон в карман — дорога продолжит считаться, пока идёт смена.",
  },
  {
    icon: "05",
    title: "Карта и история смен",
    text: "Маршруты, остановки и итоги прошлых дней собраны в одном месте — видно, где и когда выгоднее работать.",
  },
  {
    icon: "06",
    title: "Большой экран",
    text: "Удобно и на телефоне, и на планшете или компьютере — раскладка подстраивается под ширину экрана.",
  },
] as const;

export default function AionProjectPage() {
  const downloadUrl = codexStatus.latestRun?.url ?? ecosystemRoutes.releases;

  return (
    <div>
      <section className="aion-hero-glow border-b border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300/90">
            Продукт · AION Driver
          </p>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-white md:text-5xl">
            Приложение, которое ведёт смену <span className="aion-gradient-text">за вас</span>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-slate-400 md:text-lg">
            AION Driver — главный продукт экосистемы. Он считает километры, время, топливо по чекам и
            реальную прибыль, чтобы вы видели итог смены без таблиц и калькулятора.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <a
              href={downloadUrl}
              className="rounded-lg bg-cyan-400 px-6 py-3 text-sm font-semibold text-black transition hover:bg-cyan-300"
            >
              Скачать для Android
            </a>
            <Link
              href={ecosystemRoutes.releases}
              className="rounded-lg border border-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/5"
            >
              Все версии
            </Link>
          </div>
          <p className="mt-6 text-xs text-slate-500">
            Версия {apkManifest.runtimeVersion} · сборка {apkManifest.buildNumber} · Android
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-20">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300/90">
            Что умеет
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-white md:text-3xl">
            Всё для одной смены — без лишних действий
          </h2>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {abilities.map((a) => (
            <article
              key={a.title}
              className="aion-card rounded-lg border border-white/10 bg-white/[0.02] p-6"
            >
              <div className="font-mono text-xs text-cyan-300" aria-hidden="true">
                {a.icon}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-white">{a.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{a.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#0a0d0f]">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300/90">
            Как начать
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-white md:text-3xl">Три шага</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              ["1", "Скачайте приложение", "Файл для Android — кнопка выше. Установите как обычное приложение."],
              ["2", "Войдите", "Вход через Google — данные смен сохраняются и не теряются."],
              ["3", "Начните смену", "Нажмите «начать смену» и работайте — остальное приложение посчитает само."],
            ].map(([n, title, text]) => (
              <article
                key={n}
                className="aion-card rounded-lg border border-white/10 bg-white/[0.02] p-6"
              >
                <span className="font-mono text-xs text-slate-600">0{n}</span>
                <h3 className="mt-4 text-base font-semibold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
              </article>
            ))}
          </div>
          <p className="mt-8 text-sm text-slate-500">
            Новые версии приходят сами через интернет — переустанавливать ничего не нужно. Список
            обновлений —{" "}
            <Link href={ecosystemRoutes.releases} className="text-cyan-300 underline-offset-2 hover:underline">
              на странице релизов
            </Link>
            .
          </p>
        </div>
      </section>
    </div>
  );
}
