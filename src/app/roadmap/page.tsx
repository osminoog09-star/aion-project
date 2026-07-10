import type { Metadata } from "next";
import Link from "next/link";
import { ecosystemRoutes } from "@/lib/ecosystem-routes";

export const metadata: Metadata = {
  title: "План развития AION Driver — по этапам",
  description:
    "Честный поэтапный план: одна вещь доводится до конца, потом следующая. Что готово, что в работе, что дальше.",
};

type PhaseStatus = "done" | "in_progress" | "next";

const STATUS_UI: Record<PhaseStatus, { label: string; tone: string; dot: string; ring: string }> = {
  done: {
    label: "готово",
    tone: "text-emerald-300",
    dot: "bg-emerald-400",
    ring: "border-emerald-400/30 bg-emerald-400/[0.04]",
  },
  in_progress: {
    label: "в работе",
    tone: "text-cyan-300",
    dot: "bg-cyan-400",
    ring: "border-cyan-400/30 bg-cyan-400/[0.05]",
  },
  next: {
    label: "дальше",
    tone: "text-slate-400",
    dot: "bg-slate-500",
    ring: "border-white/10 bg-white/[0.02]",
  },
};

const CORE = ["Смена", "Доход", "Топливо", "Прибыль", "История", "Карта"];

type Item = { t: string; done?: boolean };

const PHASES: {
  n: string;
  title: string;
  goal: string;
  status: PhaseStatus;
  items: Item[];
  done: string;
}[] = [
  {
    n: "0",
    title: "Стабильность и чистота",
    goal: "Приложение не крашит и не путает. Ничего лишнего на виду.",
    status: "in_progress",
    items: [
      { t: "Карта на OpenStreetMap — не пустая, без Google-ключа", done: true },
      { t: "Убраны краши карты, голоса и орбиты", done: true },
      { t: "Убраны фейковые данные (цены заправок, статусы, «горячие зоны»)", done: true },
      { t: "Кнопки смены не залипают; ложная карточка обновления убрана", done: true },
      { t: "Скрыт балласт: лишние модули, desktop, Link, ИИ-центр", done: true },
      { t: "Проверка на реальном телефоне: 6 экранов ядра без вылетов" },
    ],
    done: "На реальном телефоне все 6 экранов ядра открываются без вылетов, лишнего на виду нет.",
  },
  {
    n: "1",
    title: "Смена и деньги",
    goal: "За смену всё считается верно, ничего не теряется.",
    status: "next",
    items: [
      { t: "Смена: старт / пауза / конец — надёжно, с восстановлением после сна и потери связи" },
      { t: "Доход: руками, голосом и скриншотом заработка Bolt" },
      { t: "Топливо по чеку; прибыль = доход − расходы; €/час и €/км" },
    ],
    done: "За реальную смену итог сходится, перезапуск и сон не теряют данные.",
  },
  {
    n: "2",
    title: "Карта и маршрут смены",
    goal: "Карта показывает настоящий след смены.",
    status: "next",
    items: [
      { t: "Реальный маршрут смены по GPS на карте" },
      { t: "Заправки рядом из OpenStreetMap (реальные, без выдуманных цен)" },
    ],
    done: "Карта показывает настоящий след смены, не пустая и не крашит.",
  },
  {
    n: "3",
    title: "Навигатор для Bolt",
    goal: "Принял заказ — открыл AION — видишь, куда ехать.",
    status: "next",
    items: [
      { t: "AION в списке навигаторов Android: из Bolt «Навигация» открывает AION" },
      { t: "Точка назначения, маршрут по дорогам и повороты голосом" },
    ],
    done: "Принял заказ → открыл AION → видишь маршрут до точки.",
  },
  {
    n: "4",
    title: "Авто-фиксация заказов",
    goal: "Заказ и доход записываются сами, без ручного ввода.",
    status: "next",
    items: [
      { t: "AION сам считывает карточку заказа Bolt: куда, сумма, наличные/карта" },
      { t: "Заказ и доход записываются автоматически — суммы только реальные" },
    ],
    done: "Принял и выполнил заказ — всё записалось само.",
  },
  {
    n: "5",
    title: "Умная аналитика",
    goal: "Подсказки из твоих реальных смен.",
    status: "next",
    items: [{ t: "Где и когда выгоднее работать — только по твоим настоящим сменам" }],
    done: "Подсказки строятся из реальных смен, без выдумок.",
  },
];

function phaseProgress(items: Item[]) {
  const total = items.length;
  const done = items.filter((i) => i.done).length;
  return { done, total };
}

export default function RoadmapPage() {
  const current = PHASES.find((p) => p.status === "in_progress");
  const nextUp = PHASES.find((p) => p.status === "next");

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

          {/* Где мы сейчас */}
          {current && nextUp && (
            <div className="mt-8 flex flex-col gap-3 rounded-xl border border-cyan-400/20 bg-cyan-400/[0.04] p-5 sm:flex-row sm:items-center sm:gap-6">
              <div className="flex items-center gap-2 text-sm">
                <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-400" />
                <span className="text-slate-400">Сейчас:</span>
                <span className="font-semibold text-white">
                  Этап {current.n} · {current.title}
                </span>
              </div>
              <div className="hidden h-4 w-px bg-white/10 sm:block" />
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <span>Дальше:</span>
                <span className="text-slate-300">
                  Этап {nextUp.n} · {nextUp.title}
                </span>
              </div>
            </div>
          )}

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
            const { done, total } = phaseProgress(p.items);
            const showProgress = done > 0 || p.status === "in_progress";
            return (
              <article key={p.n} className={`aion-card rounded-xl border p-6 ${s.ring}`}>
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

                <p className="mt-2 text-sm leading-6 text-slate-400">{p.goal}</p>

                {showProgress && (
                  <div className="mt-4 flex items-center gap-3">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-cyan-400 transition-all"
                        style={{ width: `${total ? (done / total) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="shrink-0 font-mono text-xs text-slate-400">
                      {done}/{total}
                    </span>
                  </div>
                )}

                <ul className="mt-4 space-y-2">
                  {p.items.map((it) => (
                    <li key={it.t} className="flex gap-2.5 text-sm leading-6">
                      <span
                        className={`mt-0.5 shrink-0 font-mono ${
                          it.done ? "text-emerald-400" : "text-slate-600"
                        }`}
                        aria-hidden="true"
                      >
                        {it.done ? "✓" : "○"}
                      </span>
                      <span className={it.done ? "text-slate-400" : "text-slate-300"}>{it.t}</span>
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
            href={ecosystemRoutes.releases}
            className="rounded-lg bg-cyan-400 px-6 py-3 text-sm font-semibold text-black transition hover:bg-cyan-300"
          >
            Скачать Driver
          </Link>
          <Link
            href={ecosystemRoutes.aionProject}
            className="rounded-lg border border-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/5"
          >
            О приложении
          </Link>
        </div>
      </section>
    </div>
  );
}
