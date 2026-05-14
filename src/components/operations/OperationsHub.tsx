import Link from "next/link";
import type { OperationsHubView } from "@/lib/operations-hub-types";
import { ecosystemRoutes } from "@/lib/ecosystem-routes";
import { ReadinessBar } from "@/components/ecosystem/EcosystemAuditViews";

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 md:p-6">
      <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-400/90">{title}</h2>
      {subtitle ? <p className="mt-1 text-[11px] text-slate-600">{subtitle}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex flex-wrap justify-between gap-2 border-b border-white/5 py-2 text-sm last:border-0">
      <span className="text-slate-500">{k}</span>
      <span className="max-w-[70%] text-right text-slate-200">{v}</span>
    </div>
  );
}

export function OperationsHub({ view, variant = "full" }: { view: OperationsHubView; variant?: "full" | "compact" }) {
  const m = view.apk.manifest;
  const compact = variant === "compact";

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-violet-500/25 bg-violet-500/5 px-4 py-3 text-xs text-violet-100/90 md:text-sm">
        <strong className="text-white">Operations Hub</strong> — единая сборка APK + OTA + релизы + roadmap + облако.
        Собрано: <time className="font-mono text-slate-400">{view.assembledAt}</time>
        {compact ? (
          <span className="text-slate-500">
            {" "}
            · <Link href={ecosystemRoutes.control} className="text-cyan-400 hover:underline">полный хаб</Link>
          </span>
        ) : null}
      </div>

      {compact ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-[10px] font-bold uppercase text-slate-500">APK (manifest)</p>
            <p className="mt-1 font-mono text-lg text-white">{m?.latestVersion ?? "—"}</p>
            <p className="text-[10px] text-slate-600">runtime {m?.runtimeVersion ?? "—"}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-[10px] font-bold uppercase text-slate-500">OTA ops</p>
            <p className="mt-1 text-2xl font-bold text-cyan-200">{view.ota.otaOps?.percent ?? "—"}%</p>
            <p className="text-[10px] text-slate-500">{view.ota.otaOps?.status ?? "—"}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-[10px] font-bold uppercase text-slate-500">Roadmap Ø</p>
            <p className="mt-1 text-2xl font-bold text-violet-200">{view.roadmap.subsystemAvg}%</p>
            <p className="text-[10px] text-slate-500">дебт: {view.roadmap.technicalDebtOpen}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-[10px] font-bold uppercase text-slate-500">Cloud</p>
            <p className="mt-1 text-lg text-white">{view.cloud.portalConfigured ? (view.cloud.snapshotsReachable ? "OK" : "ошибка") : "нет ключей"}</p>
            <p className="text-[10px] text-slate-600">{view.cloud.snapshotKinds.slice(0, 3).join(", ") || "—"}</p>
          </div>
        </div>
      ) : null}

      {!compact ? (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="APK operations" subtitle="Манифест + политика релизов">
              <Row k="Latest (manifest)" v={<span className="font-mono text-cyan-200">{m?.latestVersion ?? "—"}</span>} />
              <Row k="Minimum supported" v={<span className="font-mono">{m?.minimumSupported ?? "—"}</span>} />
              <Row k="Runtime" v={<span className="font-mono">{m?.runtimeVersion ?? "—"}</span>} />
              <Row k="Build" v={<span className="font-mono">{m?.buildNumber ?? "—"}</span>} />
              <Row k="Release date" v={m?.releaseDate ?? "—"} />
              <Row
                k="APK age"
                v={view.apk.ageDays != null ? `${view.apk.ageDays} d` : "—"}
              />
              <Row
                k="Download"
                v={
                  m?.apkUrl ? (
                    <a href={m.apkUrl} className="break-all text-cyan-400 hover:underline" target="_blank" rel="noreferrer">
                      {m.apkUrl}
                    </a>
                  ) : (
                    "—"
                  )
                }
              />
              <Row k="Force update" v={m?.forceUpdate === true ? "да" : m?.forceUpdate === false ? "нет" : "—"} />
              <Row k="Deprecated runtime" v={m?.minimumRuntimeVersion ? `min runtime ${m.minimumRuntimeVersion}` : "—"} />
              <Row k="Rollout (manifest)" v={m?.rolloutState ?? "—"} />
              <Row k="Emergency" v={m?.emergency === true ? "да" : "нет"} />
              <Row k="Releases.json latest" v={<span className="font-mono">{view.apk.latestKnownFromReleases}</span>} />
              <Row k="Manifest URL" v={<span className="break-all font-mono text-[11px]">{view.apk.manifestUrl || "(не задан)"}</span>} />
              <p className="mt-3 text-xs text-slate-500">{view.apk.policyNote}</p>
              {m?.releaseNotes ? <p className="mt-2 text-sm text-slate-400">{m.releaseNotes}</p> : null}
              {m?.changelog?.length ? (
                <ul className="mt-2 list-inside list-disc text-xs text-slate-500">
                  {m.changelog.slice(0, 8).map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              ) : null}
            </Card>

            <Card title="OTA operations" subtitle="Каналы, rollout, строка ops из roadmap">
              <Row
                k="Ops health %"
                v={
                  view.ota.otaOps ? (
                    <span>
                      {view.ota.otaOps.percent}% · {view.ota.otaOps.status}
                    </span>
                  ) : (
                    "—"
                  )
                }
              />
              <div className="mt-3 space-y-3">
                {view.ota.channels.map((ch) => (
                  <div key={ch.id} className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
                    <p className="text-sm font-semibold text-white">{ch.label}</p>
                    <p className="text-[11px] text-slate-500">{ch.description}</p>
                    <p className="mt-1 font-mono text-xs text-cyan-300/90">app {ch.appVersion}</p>
                    <p className="text-[11px] text-slate-600">{ch.notes}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-[10px] font-bold uppercase text-slate-500">Публичный rollout</p>
              {view.ota.rollouts.length === 0 ? (
                <p className="mt-2 text-xs text-slate-600">Нет строк visible_public в ecosystem_rollout_state.</p>
              ) : (
                <ul className="mt-2 space-y-2 text-xs text-slate-300">
                  {view.ota.rollouts.map((r) => (
                    <li key={r.id} className="rounded border border-white/10 px-2 py-1 font-mono">
                      {r.channel} · {r.rollout_status} · {String(r.cohort_percentage ?? "—")}% · {r.updated_at}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Release operations" subtitle="История и канон версий">
              <Row k="Releases.json updated" v={view.releases.lastUpdated} />
              <p className="mt-3 text-[10px] font-bold uppercase text-slate-500">Timeline</p>
              <ul className="mt-2 space-y-2 text-xs text-slate-400">
                {view.releases.history.map((h) => (
                  <li key={h.title + h.date} className="border-l-2 border-cyan-500/30 pl-3">
                    <span className="text-slate-600">
                      {h.date} · {h.type}
                    </span>
                    <p className="font-medium text-slate-200">{h.title}</p>
                    <p className="text-slate-500">{h.detail}</p>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-slate-600">
                Viewed/unviewed для OTA — в клиенте (AsyncStorage); портал показывает публичный индекс.{" "}
                <Link href={ecosystemRoutes.releases} className="text-cyan-400 hover:underline">
                  /releases
                </Link>
              </p>
            </Card>

            <Card title="Roadmap operations" subtitle="Сводка с /roadmap + /status">
              <Row k="Спринт" v={view.roadmap.sprintLabel} />
              <Row k="Фокус" v={view.roadmap.sprintFocus} />
              <Row k="Readiness pillars Ø" v={`${view.roadmap.readinessPillarAvg}%`} />
              <Row k="Подсистемы Ø" v={`${view.roadmap.subsystemAvg}%`} />
              <Row k="Открытый техдолг (позиций)" v={String(view.roadmap.technicalDebtOpen)} />
              <p className="mt-3 text-[10px] font-bold uppercase text-rose-300/80">Заблокированные / с блокерами</p>
              {view.roadmap.blockedSubsystems.length === 0 ? (
                <p className="mt-1 text-xs text-slate-600">Нет помеченных блокеров в JSON.</p>
              ) : (
                <ul className="mt-1 list-inside list-disc text-xs text-rose-200/90">
                  {view.roadmap.blockedSubsystems.map((b) => (
                    <li key={b.id}>{b.name}</li>
                  ))}
                </ul>
              )}
              <p className="mt-3 text-[10px] font-bold uppercase text-slate-500">Активные эпики</p>
              <ul className="mt-1 list-inside list-disc text-xs text-slate-400">
                {view.roadmap.activeEpics.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
              <div className="mt-4 flex flex-wrap gap-3 text-xs">
                <Link href={ecosystemRoutes.roadmap} className="text-cyan-400 hover:underline">
                  Roadmap
                </Link>
                <Link href={ecosystemRoutes.status} className="text-cyan-400 hover:underline">
                  Status
                </Link>
                <Link href={ecosystemRoutes.ecosystem} className="text-cyan-400 hover:underline">
                  Ecosystem
                </Link>
                <Link href={ecosystemRoutes.operations} className="text-cyan-400 hover:underline">
                  Execution
                </Link>
              </div>
            </Card>
          </div>

          <Card title="Device operations" subtitle={view.deviceCenter.headline}>
            <p className="text-sm text-slate-400">{view.deviceCenter.detail}</p>
            <p className="mt-3 text-xs text-amber-200/90">
              Не строим фейковые счётчики устройств: требуется аутентификация и серверные агрегаты.
            </p>
          </Card>

          <Card title="Cloud + infrastructure health" subtitle="Supabase + ops строки">
            <Row k="NEXT_PUBLIC_SUPABASE" v={view.cloud.portalConfigured ? "настроено" : "не задано"} />
            <Row k="Snapshots SELECT" v={view.cloud.snapshotsReachable ? "ok" : view.cloud.portalConfigured ? "ошибка" : "—"} />
            {view.cloud.probeError ? <Row k="Ошибка пробы" v={<span className="text-rose-300">{view.cloud.probeError}</span>} /> : null}
            <Row k="Виды snapshots" v={view.cloud.snapshotKinds.length ? view.cloud.snapshotKinds.join(", ") : "—"} />
            <p className="mt-4 text-[10px] font-bold uppercase text-slate-500">Очереди / sync / realtime / OCR (из roadmap operations)</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {(["sync", "realtime", "cloud", "ocr"] as const).map((key) => {
                const row = view.healthRows[key];
                if (!row) return null;
                return (
                  <div key={key} className="rounded-lg border border-white/10 p-3">
                    <p className="text-[10px] uppercase text-slate-500">{row.label}</p>
                    <p className="text-lg font-bold text-white">{row.percent}%</p>
                    <ReadinessBar value={row.percent} />
                    <p className="mt-2 text-[11px] text-slate-500">{row.summary}</p>
                  </div>
                );
              })}
            </div>
          </Card>
        </>
      ) : null}
    </div>
  );
}
