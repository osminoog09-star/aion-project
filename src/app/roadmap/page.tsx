import type { Metadata } from "next";
import Link from "next/link";
import { ecosystemRoutes } from "@/lib/ecosystem-routes";

export const metadata: Metadata = {
  title: "План развития AION Driver — по этапам",
  description:
    "Честный поэтапный план: одна вещь доводится до конца, потом следующая. Что готово, что в работе, что дальше.",
};

type PhaseStatus = "done" | "in_progress" | "next";

const STATUS_UI: Record<PhaseStatus, { label: string; tone: string; dot: string }> = {
  done: { label: "готово", tone: "text-emerald-300", dot: "bg-emerald-400" },
  in_progress: { label: "в работе", tone: "text-cyan-300", dot: "bg-cyan-400" },
  next: { label: "дальше", tone: "text-slate-300", dot: "bg-slate-500" },
};

const CORE = ["Смена", "Доход", "Топливо", "Прибыль", "История", "Карта"];

const PHASES: {
  n: string;
  title: string;
  status: PhaseStatus;
  points: string[];
  done: string;
}[] = [
  {
    n: "0",
    title: "Стабильность и чистота",
    status: "in_progress",
    points: [
      "Карта на OpenStreetMap — не пустая, без Google-ключа",
      "Убраны краши (орбита, голос, карта) и все фейковые данные",
      "Убран балласт: лишние модули и разделы скрыты",
    ],
    done: "Все 6 экранов ядра открываются без вылетов, лишнего на виду нет.",
  },
  {
    n: "1",
    title: "Смена и деньги",
    status: "next",
    points: [
      "Смена: старт/пауза/конец — надёжно, с восстановлением после сна и потери связи",
      "Доход: руками, голосом и скриншотом заработка Bolt",
      "Топливо по чеку, прибыль = доход − расходы, ₽/час и ₽/км",
    ],
    done: "За реальную смену итог сходится, ничего не теряется.",
  },
  {
    n: "2",
    title: "Карта и маршрут смены",
    status: "next",
    points: ["Реальный маршрут смены по GPS на карте", "Заправки рядом из OpenStreetMap"],
    done: "Карта показывает настоящий след смены.",
  },
  {
    n: "3",
    title: "Навигатор для Bolt",
    status: "next",
    points: [
      "AION в списке навигаторов — из Bolt «Навигация» открывает AION",
      "Точка назначения, маршрут по дорогам и повороты",
    ],
    done: "Принял заказ → открыл AION → видишь маршрут до точки.",
  },
  {
    n: "4",
    title: "Авто-фиксация заказов",
    status: "next",
    points: [
      "AION сам считывает карточку заказа Bolt: куда, сумма, наличные/карта",
      "Заказ и доход записываются без ручного ввода — суммы только реальные",
    ],
    done: "Принял и выполнил заказ — всё записалось само.",
  },
  {
    n: "5",
    title: "Умная аналитика",
    status: "next",
    points: ["Где и когда выгоднее работать — только по твоим настоящим сменам"],
    done: "Подсказки из реальных смен, без выдумок.",
  },
];

export default function RoadmapPage() {
  return (
    <div>
      <section className="aion-hero-glow border-b border-white/10">
        <div className="mx-auto max-w-4xl px-4 py-16 md:px-6 md:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300/90">
            AION Driver · план
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight text-white md:text-5xl">
            Одна вещь до конца —<br />
            потом следующая
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-slate-400 md:text-lg">
            Честный план по этапам. Каждый этап доводится до железной надёжности, и только
            потом начинается следующий. Никакого бега по сотне недоделок.
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
          <p className="mt-3 text-xs text-slate-400">
            Ядро приложения. Пока оно не железное — новое не начинаем.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-14 md:px-6 md:py-16">
        <div className="space-y-4">
          {PHASES.map((p) => {
            const s = STATUS_UI[p.status];
            return (
              <article
                key={p.n}
                className={`aion-card rounded-xl border p-6 ${
                  p.status === "in_progress"
                    ? "border-cyan-400/30 bg-cyan-400/[0.04]"
                    : "border-white/10 bg-white/[0.02]"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono text-sm text-slate-500">Этап {p.n}</span>
                    <h2 className="text-xl font-semibold text-white">{p.title}</h2>
                  </div>
                  <span className={`inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold ${s.tone}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                    {s.label}
                  </span>
                </div>
                <ul className="mt-4 space-y-2">
                  {p.points.map((pt) => (
                    <li key={pt} className="flex gap-2 text-sm leading-6 text-slate-300">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-slate-500" />
                      {pt}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xs leading-5 text-slate-400">
                  <span className="font-semibold text-slate-300">Готово, когда:</span> {p.done}
                </p>
              </article>
            );
          })}
        </div>

        <div className="mt-10 rounded-xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">Заморожено</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Всё, что не про водителя за рулём, убрано с глаз и не трогается, пока ядро не железное:
            орбита поверх экрана, лишние «модули», десктоп-экраны, служебные панели. Меньше
            приложение — меньше ломается.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={ecosystemRoutes.aionProject}
            className="rounded-lg bg-cyan-400 px-6 py-3 text-sm font-semibold text-black transition hover:bg-cyan-300"
          >
            О приложении Driver
          </Link>
          <Link
            href={ecosystemRoutes.releases}
            className="rounded-lg border border-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/5"
          >
            Скачать
          </Link>
        </div>
      </section>
    </div>
  );
}
