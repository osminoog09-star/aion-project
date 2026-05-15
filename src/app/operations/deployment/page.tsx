import type { Metadata } from "next";
import Link from "next/link";
import { OperationsSubNav } from "@/components/operations/ExecutionAuditPanels";
import { getDeploymentStatus } from "@/lib/deployment-status";
import { ecosystemRoutes } from "@/lib/ecosystem-routes";

export const metadata: Metadata = {
  title: "Deployment health — production pipeline",
  description: "Vercel production deploy status and operations route validation.",
};

export default function OperationsDeploymentPage() {
  const d = getDeploymentStatus();
  const deploy = d.lastProductionDeploy;
  const routes = Object.entries(d.routeValidation.routes);

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20">
      <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-emerald-400/90">
        deployment pipeline
      </p>
      <h1 className="mt-3 text-3xl font-bold text-white md:text-4xl">Production deploy</h1>
      <p className="mt-3 max-w-3xl text-sm text-slate-400">
        Autonomous pipeline health — no manual owner relay. Target:{" "}
        <span className="font-mono text-slate-300">{d.productionUrl}</span>
      </p>
      <OperationsSubNav />

      <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">Last deploy</h2>
        <p className="mt-2 text-lg font-semibold text-white">Status: {deploy.status}</p>
        <ul className="mt-3 space-y-1 text-sm text-slate-400">
          <li>Commit: {deploy.commit ?? "—"}</li>
          <li>Deployed: {deploy.deployedAt ?? "—"}</li>
          <li>Trigger: {deploy.trigger}</li>
          {deploy.notes ? <li className="text-amber-200/80">{deploy.notes}</li> : null}
        </ul>
      </section>

      <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-400/90">
          Route validation {d.routeValidation.allPassed ? "✓" : "✗"}
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Checked: {d.routeValidation.checkedAt ?? "never"} · {d.routeValidation.baseUrl}
        </p>
        <ul className="mt-4 space-y-2 font-mono text-xs">
          {routes.map(([route, v]) => (
            <li key={route} className="flex justify-between gap-4">
              <span className="text-slate-300">{route}</span>
              <span className={v.status === "pass" ? "text-emerald-400" : "text-rose-400"}>
                {v.status} {v.httpStatus ?? ""}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {d.pipelineBlockers.length ? (
        <section className="mt-6 rounded-2xl border border-rose-500/30 bg-rose-500/5 p-5">
          <h2 className="text-xs font-bold uppercase text-rose-300">Blockers</h2>
          <ul className="mt-2 list-inside list-disc text-sm text-slate-300">
            {d.pipelineBlockers.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-6 rounded-2xl border border-violet-500/25 bg-violet-500/5 p-5 text-xs text-slate-400">
        <p className="font-bold uppercase text-violet-300/90">Autonomous recovery</p>
        <ul className="mt-2 list-inside list-decimal space-y-1">
          {d.autonomousRecovery.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
        <p className="mt-3 font-mono text-[11px] text-slate-500">
          Vercel: {d.vercelProjectId} · Git: {d.expectedGitRemote}
        </p>
      </section>

      <p className="mt-6 text-xs">
        <Link href={ecosystemRoutes.operations} className="text-cyan-400 hover:underline">
          ← Operations
        </Link>
      </p>
    </div>
  );
}
