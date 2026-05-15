import type { Metadata } from "next";
import Link from "next/link";
import { OperationsSubNav } from "@/components/operations/ExecutionAuditPanels";
import { getDeploymentStatus } from "@/lib/deployment-status";
import { ecosystemRoutes } from "@/lib/ecosystem-routes";

export const metadata: Metadata = {
  title: "Deployment health — production pipeline",
  description: "Vercel production deploy status and operations route validation.",
};

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "ok"
      ? "border-emerald-500/40 text-emerald-300"
      : status === "in_progress"
        ? "border-cyan-500/40 text-cyan-300"
        : status === "failed"
          ? "border-rose-500/40 text-rose-300"
          : "border-amber-500/40 text-amber-300";
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase ${cls}`}>
      {status}
    </span>
  );
}

export default function OperationsDeploymentPage() {
  const d = getDeploymentStatus();
  const deploy = d.lastProductionDeploy;
  const routes = Object.entries(d.routeValidation.routes);

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20">
      <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-emerald-400/90">
        deployment pipeline v{d.pipelineVersion}
      </p>
      <h1 className="mt-3 text-3xl font-bold text-white md:text-4xl">Production deploy</h1>
      <p className="mt-3 max-w-3xl text-sm text-slate-400">
        System-owned deployment health. Target:{" "}
        <a href={d.productionUrl} className="font-mono text-cyan-400 hover:underline">
          {d.productionUrl}
        </a>
      </p>
      <OperationsSubNav />

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <p className="text-[10px] uppercase text-slate-500">Deploy</p>
          <div className="mt-2">
            <StatusBadge status={deploy.status} />
          </div>
          <p className="mt-2 font-mono text-xs text-slate-400">{deploy.commit ?? "—"}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <p className="text-[10px] uppercase text-slate-500">GitHub</p>
          <p className="mt-2 text-sm text-white">
            {d.gitLinkage.githubRepoExists ? "linked" : "repo missing"}
          </p>
          <p className="text-xs text-slate-500">{d.gitLinkage.defaultBranch}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <p className="text-[10px] uppercase text-slate-500">Routes</p>
          <p className="mt-2 text-2xl font-bold text-white">
            {d.routeValidation.allPassed ? "PASS" : "FAIL"}
          </p>
          {deploy.durationMs != null ? (
            <p className="text-xs text-slate-500">last check {deploy.durationMs}ms</p>
          ) : null}
        </div>
      </div>

      <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">
          Latest deployment
        </h2>
        <ul className="mt-3 space-y-1 text-sm text-slate-400">
          <li>Deployed: {deploy.deployedAt ?? "—"}</li>
          <li>Trigger: {deploy.trigger}</li>
          <li>Duration: {deploy.durationMs != null ? `${deploy.durationMs}ms` : "—"}</li>
          <li>Rollback ref: {deploy.rollbackTarget ?? "previous Vercel deployment (dashboard)"}</li>
          <li>Deployment URL: {deploy.deploymentUrl ?? "—"}</li>
          {deploy.notes ? <li className="text-amber-200/80">{deploy.notes}</li> : null}
        </ul>
      </section>

      <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-400/90">
          Route validation
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          HTTP + render markers · {d.routeValidation.checkedAt ?? "never"}
        </p>
        <ul className="mt-4 space-y-2 font-mono text-xs">
          {routes.map(([route, v]) => (
            <li key={route} className="flex flex-wrap justify-between gap-2">
              <a href={`${d.productionUrl}${route}`} className="text-cyan-400/90 hover:underline">
                {route}
              </a>
              <span className={v.status === "pass" && v.renderOk ? "text-emerald-400" : "text-rose-400"}>
                {v.httpStatus ?? "—"} · render {v.renderOk ? "ok" : "fail"}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">
          Deployment timeline
        </h2>
        <ul className="mt-3 space-y-2 text-xs text-slate-400">
          {(d.deploymentTimeline ?? []).slice(0, 12).map((e) => (
            <li key={e.at + e.kind} className="border-l-2 border-violet-500/40 pl-3">
              <span className="text-slate-600">{e.at}</span> ·{" "}
              <span className="text-violet-300">{e.kind}</span>
              <p className="text-slate-300">{e.summary}</p>
            </li>
          ))}
        </ul>
        <Link href={ecosystemRoutes.operationsTimeline} className="mt-3 inline-block text-cyan-400">
          Implementation feed →
        </Link>
      </section>

      {d.pipelineBlockers.length ? (
        <section className="mt-6 rounded-2xl border border-rose-500/30 bg-rose-500/5 p-5">
          <h2 className="text-xs font-bold uppercase text-rose-300">Blockers (system)</h2>
          <ul className="mt-2 list-inside list-disc text-sm text-slate-300">
            {d.pipelineBlockers.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
          <div className="mt-4 rounded-lg bg-black/30 p-3 font-mono text-[11px] text-amber-200/90">
            <p className="font-bold text-amber-300">One-time owner unblock</p>
            {Object.entries(d.ownerUnblock).map(([k, v]) => (
              <p key={k} className="mt-2">
                {v}
              </p>
            ))}
          </div>
        </section>
      ) : null}

      <p className="mt-6 text-xs text-slate-600">
        Vercel {d.vercelProjectId} · auto-deploy {d.vercelLinkage.autoDeployOnPush ? "on" : "off"}
      </p>
    </div>
  );
}
