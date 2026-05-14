import type { Metadata } from "next";
import Link from "next/link";
import { ecosystemRoutes } from "@/lib/ecosystem-routes";

export const metadata: Metadata = {
  title: "AION Driver — модуль экосистемы",
  description:
    "Первый активный модуль платформы AION: мобильный и desktop кокпит, OCR, AION Link, OTA. Раздел www.aion.com/aionproject — не вся экосистема.",
  alternates: { canonical: ecosystemRoutes.aionProject },
};

export default function AionProjectPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20">
      <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-cyan-400/90">www.aion.com · Module</p>
      <h1 className="mt-3 text-3xl font-bold text-white md:text-4xl">AION Driver</h1>
      <p className="mt-2 text-sm text-slate-500">
        Каноническая страница модуля на портале экосистемы. Клиент — отдельный билд (Expo / EAS); здесь позиционирование
        в общей архитектуре AION и связь с релизами.
      </p>
      <p className="mt-4 max-w-3xl text-slate-400">
        <strong className="text-slate-200">AION Driver</strong> — первый активный продуктовый модуль платформы: смена,
        аналитика, OCR импорт выплат, карта, гараж, режим второго телефона и AION Link. Desktop-маршрут внутри
        приложения для широкого экрана. Транспортный контекст — домен модуля, а не определение всей экосистемы AION.
      </p>
      <ul className="mt-10 grid gap-4 md:grid-cols-2">
        {[
          "OCR intelligence — текст и мульти-изображения",
          "Кокпит и дашборд с живой метрикой",
          "Desktop / web workspace (Expo web)",
          "AION Entity — состояние системы в приложении",
          "AION Link — синхронизация рабочего телефона (в развитии)",
          "OTA и каналы preview / production",
        ].map((t) => (
          <li
            key={t}
            className="rounded-xl border border-cyan-500/20 bg-cyan-500/[0.04] px-4 py-3 text-sm text-slate-300"
          >
            {t}
          </li>
        ))}
      </ul>
      <p className="mt-10 text-sm text-slate-500">
        Установка и обновления — через ваши EAS-каналы; версии и манифест —{" "}
        <Link href={ecosystemRoutes.releases} className="text-cyan-400 underline-offset-2 hover:underline">
          Релизы
        </Link>
        . Платформа:{" "}
        <Link href={ecosystemRoutes.home} className="text-cyan-400 underline-offset-2 hover:underline">
          главная
        </Link>
        , операции —{" "}
        <Link href={ecosystemRoutes.control} className="text-cyan-400 underline-offset-2 hover:underline">
          Control
        </Link>
        .
      </p>
    </div>
  );
}
