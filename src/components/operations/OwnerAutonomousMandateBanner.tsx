"use client";

import { useEffect, useState } from "react";

type MandatePayload = {
  active: boolean;
  labelRu: string;
  startedAt: string;
  endsAt: string;
  remainingMs: number;
  progressPercent: number;
};

export function OwnerAutonomousMandateBanner() {
  const [mandate, setMandate] = useState<MandatePayload | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/execution-runtime", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { ownerMandate?: MandatePayload | null };
        if (data.ownerMandate?.active) setMandate(data.ownerMandate);
        else setMandate(null);
      } catch {
        setMandate(null);
      }
    };
    void load();
    const id = setInterval(() => void load(), 15_000);
    return () => clearInterval(id);
  }, []);

  if (!mandate) return null;

  const remainingMin = Math.max(0, Math.ceil(mandate.remainingMs / 60_000));

  return (
    <section className="mb-6 rounded-2xl border border-violet-500/40 bg-gradient-to-r from-violet-950/50 via-slate-950 to-cyan-950/40 px-5 py-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-violet-300">
        Поручение владельца · автономный режим
      </p>
      <p className="mt-2 text-lg font-semibold text-white">{mandate.labelRu}</p>
      <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-300">
        <span>
          Осталось: <span className="font-semibold text-cyan-200">~{remainingMin} мин</span>
        </span>
        <span>
          Прогресс сессии:{" "}
          <span className="font-semibold text-emerald-300">{mandate.progressPercent}%</span>
        </span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-500"
          style={{ width: `${Math.min(100, mandate.progressPercent)}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-slate-500">
        AI продолжает roadmap без запросов «что дальше?» · обновление каждые 15 сек
      </p>
    </section>
  );
}
