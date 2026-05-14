import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "AION Driver — флагман экосистемы",
  description:
    "Мобильный кокпит, OCR, desktop, AION Link, синхронизация — флагманский модуль AION для профессиональных водителей.",
};

export default function DriverPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20">
      <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-cyan-400/90">Flagship module</p>
      <h1 className="mt-3 text-3xl font-bold text-white md:text-4xl">AION Driver</h1>
      <p className="mt-4 max-w-3xl text-slate-400">
        Первый продукт семейства AION: смена, аналитика, OCR импорт выплат, карта, гараж, режим второго телефона и
        AION Link для связки рабочего и личного устройства. Desktop-маршрут внутри приложения для широкого экрана.
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
        Установка и обновления — через ваши EAS-каналы; детали версий см.{" "}
        <Link href="/releases" className="text-cyan-400 underline-offset-2 hover:underline">
          Релизы
        </Link>
        .
      </p>
    </div>
  );
}
