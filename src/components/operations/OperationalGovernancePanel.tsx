"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type GovPayload = {
  governance: {
    safeMode: boolean;
    automationLocked: boolean;
    reasonRu: string;
    watchdogStale: boolean;
  };
  release: {
    headlineRu: string;
    apkBuildRequired: boolean;
    otaOnlyAllowed: boolean;
    requiresNativeBuild: boolean;
    runtimeActivationAllowed: boolean;
    validationFlowsAllowed: boolean;
    publishedApkVersion: string | null;
    driverSourceVersion: string | null;
    portalMinVersion: string;
    recommendedActions: string[];
    nativeChangeHints: string[];
  };
  runtime: {
    phase: string;
    heartbeatAt: string;
    blocker: string | null;
    currentTask: string;
  };
  deployment: {
    status?: string;
    routesOk?: boolean;
  };
  persistedVia: string;
  recentEvents: { at: string; type: string; summary: string }[];
  stabilizationSignoff?: {
    signedOff: boolean;
    summary: string;
    nextSteps?: string[];
  };
  executionConfidence?: {
    autonomousAllowed: boolean;
    requiresHuman: boolean;
    confidence: number;
    reasonRu: string;
    nextAutonomousAction: string | null;
    humanBoundary: string | null;
  };
  continuation?: {
    stopAtHuman: boolean;
    humanPromptRu: string | null;
    steps: { order: number; kind: string; descriptionRu: string; command?: string }[];
  };
};

type ReleaseTelemetry = {
  pipelineStatus: string;
  buildId: string | null;
  easStatus: string | null;
  workflowRunUrl: string | null;
  expoBuildUrl: string | null;
  recentTrace: { at: string; stage: string; message: string; level?: string }[];
};

export function OperationalGovernancePanel() {
  const [data, setData] = useState<GovPayload | null>(null);
  const [telemetry, setTelemetry] = useState<ReleaseTelemetry | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [govRes, telRes] = await Promise.all([
          fetch("/api/operations/governance", { cache: "no-store" }),
          fetch("/api/operations/release-telemetry", { cache: "no-store" }),
        ]);
        if (govRes.ok) setData((await govRes.json()) as GovPayload);
        if (telRes.ok) setTelemetry((await telRes.json()) as ReleaseTelemetry);
      } catch {
        setData(null);
      }
    };
    void load();
    const id = setInterval(() => void load(), 10_000);
    return () => clearInterval(id);
  }, []);

  if (!data) {
    return <p className="text-sm text-slate-500">Загрузка governance…</p>;
  }

  const border = data.governance.safeMode
    ? "border-rose-500/45 bg-rose-500/10"
    : "border-emerald-500/35 bg-emerald-500/8";

  return (
    <div className="space-y-6">
      <section className={`rounded-2xl border px-5 py-5 ${border}`}>
        <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-slate-400">
          Engineering governance
        </p>
        <p className="mt-2 text-lg font-semibold text-white">{data.release.headlineRu}</p>
        <p className="mt-2 text-sm text-slate-300">{data.governance.reasonRu}</p>
        {data.executionConfidence ? (
          <p className="mt-3 text-xs text-slate-400">
            Autonomous:{" "}
            <span className={data.executionConfidence.autonomousAllowed ? "text-emerald-300" : "text-amber-200"}>
              {data.executionConfidence.autonomousAllowed ? "allowed" : "limited"}
            </span>
            {" · "}
            confidence {(data.executionConfidence.confidence * 100).toFixed(0)}% —{" "}
            {data.executionConfidence.reasonRu}
          </p>
        ) : null}
        {telemetry ? (
          <section className="mt-4 rounded-xl border border-white/10 bg-black/20 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Release pipeline (CI/EAS)
            </p>
            <p className="mt-1 font-mono text-sm text-cyan-200">{telemetry.pipelineStatus}</p>
            {telemetry.buildId ? (
              <p className="mt-1 text-xs text-slate-400">
                BUILD_ID: {telemetry.buildId}
                {telemetry.easStatus ? ` · EAS ${telemetry.easStatus}` : ""}
              </p>
            ) : null}
            {telemetry.recentTrace?.length ? (
              <ul className="mt-2 max-h-24 overflow-y-auto font-mono text-[10px] text-slate-500">
                {telemetry.recentTrace.slice(0, 6).map((t) => (
                  <li key={t.at + t.stage}>
                    {t.stage}: {t.message}
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ) : null}
        {data.continuation?.stopAtHuman && data.continuation.humanPromptRu ? (
          <p className="mt-2 rounded border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
            Human boundary: {data.continuation.humanPromptRu}
          </p>
        ) : null}
        {data.stabilizationSignoff ? (
          <p
            className={`mt-3 rounded-lg border px-3 py-2 text-xs ${
              data.stabilizationSignoff.signedOff
                ? "border-emerald-500/40 text-emerald-200"
                : "border-amber-500/40 text-amber-100"
            }`}
          >
            Sign-off: {data.stabilizationSignoff.summary}
          </p>
        ) : null}
        <div className="mt-4 grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-3">
          <Cell k="Live source" v={data.persistedVia} />
          <Cell k="Runtime phase" v={data.runtime.phase} />
          <Cell
            k="Heartbeat"
            v={new Date(data.runtime.heartbeatAt).toLocaleString("ru-RU")}
          />
          <Cell k="APK manifest" v={data.release.publishedApkVersion ?? "—"} />
          <Cell k="Driver source" v={data.release.driverSourceVersion ?? "—"} />
          <Cell k="Portal min" v={`≥ ${data.release.portalMinVersion}`} />
          <Cell
            k="Runtime activation"
            v={data.release.runtimeActivationAllowed ? "allowed" : "BLOCKED"}
          />
          <Cell
            k="Validation flows"
            v={data.release.validationFlowsAllowed ? "allowed" : "BLOCKED"}
          />
          <Cell k="OTA only" v={data.release.otaOnlyAllowed ? "yes" : "no"} />
          <Cell k="APK build" v={data.release.apkBuildRequired ? "required" : "ok"} />
          <Cell k="Native build" v={data.release.requiresNativeBuild ? "required" : "no"} />
          <Cell k="Automation" v={data.governance.automationLocked ? "LOCKED" : "active"} />
          <Cell k="Deploy" v={data.deployment.status ?? "—"} />
        </div>
        {data.release.nativeChangeHints.length ? (
          <p className="mt-3 text-xs text-amber-200/90">
            Native paths: {data.release.nativeChangeHints.join(", ")}
          </p>
        ) : null}
        {data.release.recommendedActions.length ? (
          <ul className="mt-4 list-inside list-disc text-xs text-cyan-200/90">
            {data.release.recommendedActions.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        ) : null}
      </section>

      {data.recentEvents.length ? (
        <section className="rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Event stream
          </p>
          <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto font-mono text-[10px] text-slate-400">
            {data.recentEvents.map((e, i) => (
              <li key={`${e.at}-${i}`}>
                {e.type}: {e.summary}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Link
          href="/operations/live"
          className="rounded-full border border-cyan-400/40 px-4 py-2 text-xs text-cyan-200"
        >
          Live execution →
        </Link>
        <Link
          href="/operations/deployment"
          className="rounded-full border border-white/15 px-4 py-2 text-xs text-slate-300"
        >
          Deployment →
        </Link>
        <Link
          href="/releases"
          className="rounded-full border border-white/15 px-4 py-2 text-xs text-slate-300"
        >
          Releases / APK →
        </Link>
      </div>
    </div>
  );
}

function Cell({ k, v }: { k: string; v: string }) {
  return (
    <p>
      <span className="text-slate-500">{k}: </span>
      <span className="font-mono text-slate-200">{v}</span>
    </p>
  );
}
