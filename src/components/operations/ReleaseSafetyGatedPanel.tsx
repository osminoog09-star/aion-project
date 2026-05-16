"use client";

import { useEffect, useState, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
};

/** Renders children only when portal release safety allows field validation flows. */
export function ReleaseSafetyGatedPanel({ children, fallback }: Props) {
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/operations/device-heartbeat", { cache: "no-store" });
        if (!res.ok) {
          setAllowed(false);
          return;
        }
        const data = (await res.json()) as {
          safety: { safeMode: boolean; canRequireFieldValidation: boolean };
        };
        setAllowed(!data.safety.safeMode && data.safety.canRequireFieldValidation);
      } catch {
        setAllowed(false);
      }
    };
    void load();
  }, []);

  if (allowed === null) {
    return <p className="text-sm text-slate-500">Проверка совместимости сборки…</p>;
  }

  if (!allowed) {
    return (
      fallback ?? (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/8 px-4 py-3 text-sm text-amber-200/90">
          Чеклист 8/8 и OTA smoke недоступны на этой сборке — сначала обновите Driver (см. баннер выше).
        </p>
      )
    );
  }

  return <>{children}</>;
}
