"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type SafetyPayload = {
  safeMode: boolean;
  canRequireFieldValidation: boolean;
  headlineRu: string;
  detailRu: string;
  compatibility: {
    compatible: boolean;
    missingFeatures: string[];
    missingRoutes: string[];
    upgradeRequired: boolean;
    reasonRu: string;
    versionGap?: { field: string; required: string; actual: string };
  };
  requirements: { minRuntimeVersion: string; minAppVersion?: string; minVersionCode?: number };
  publishedManifest: { runtimeVersion?: string; latestVersion?: string } | null;
  effectiveDevice: { runtimeVersion?: string; appVersion?: string; versionCode?: number } | null;
};

export function ReleaseSafetyBanner({ disableValidationUi = true }: { disableValidationUi?: boolean }) {
  const [safety, setSafety] = useState<SafetyPayload | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/operations/device-heartbeat", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { safety: SafetyPayload };
        setSafety(data.safety);
      } catch {
        setSafety(null);
      }
    };
    void load();
    const id = setInterval(() => void load(), 20_000);
    return () => clearInterval(id);
  }, []);

  if (!safety) return null;

  const show = safety.safeMode || !safety.canRequireFieldValidation;
  if (!show && safety.compatibility.compatible) return null;

  const border = safety.safeMode ? "border-rose-500/50 bg-rose-500/12" : "border-amber-500/40 bg-amber-500/10";

  return (
    <section className={`mb-6 rounded-2xl border px-5 py-5 ${border}`}>
      <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-rose-300">
        Release safety · SAFE MODE
      </p>
      <p className="mt-2 text-lg font-semibold text-white">{safety.headlineRu}</p>
      <p className="mt-2 text-sm text-slate-300">{safety.detailRu}</p>
      <div className="mt-4 grid gap-2 text-xs sm:grid-cols-2">
        <p>
          <span className="text-slate-500">Портал требует runtime: </span>
          <span className="font-mono text-cyan-200">≥ {safety.requirements.minRuntimeVersion}</span>
        </p>
        <p>
          <span className="text-slate-500">APK manifest: </span>
          <span className="font-mono text-amber-200">
            {safety.publishedManifest?.runtimeVersion ?? "—"}
          </span>
        </p>
        <p>
          <span className="text-slate-500">Устройство / proxy: </span>
          <span className="font-mono text-slate-200">
            {safety.effectiveDevice?.runtimeVersion ?? "нет heartbeat"}
            {safety.effectiveDevice?.appVersion
              ? ` · app ${safety.effectiveDevice.appVersion}`
              : ""}
          </span>
        </p>
        {safety.compatibility.versionGap ? (
          <p className="col-span-2 text-rose-200/90">
            {safety.compatibility.versionGap.field}: {safety.compatibility.versionGap.actual} → нужно{" "}
            {safety.compatibility.versionGap.required}
          </p>
        ) : null}
      </div>
      {disableValidationUi && safety.safeMode ? (
        <p className="mt-4 text-sm text-amber-200/90">
          Field validation 8/8, OTA smoke и блокеры runtime <strong>отключены</strong>, пока сборка не
          совместима.
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href="/releases"
          className="rounded-full border border-cyan-400/40 bg-cyan-500/15 px-4 py-2 text-xs font-semibold text-cyan-100"
        >
          Update Center / APK →
        </Link>
        <Link
          href="/operations/deployment"
          className="rounded-full border border-white/15 px-4 py-2 text-xs text-slate-300"
        >
          Deployment pipeline
        </Link>
      </div>
    </section>
  );
}
