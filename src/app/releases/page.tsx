import type { Metadata } from "next";
import Link from "next/link";
import type { ReleaseChannel, ReleasesPayload } from "@/lib/ecosystem-types";
import { getReleasesPayload } from "@/lib/ecosystem-data";
import { fetchPublishedApkManifest } from "@/lib/fetchApkManifest";
import { ecosystemRoutes } from "@/lib/ecosystem-routes";

export const metadata: Metadata = {
  title: "Релизы и обновления AION",
  description:
    "Как обновляется AION Driver: каналы, актуальная версия для скачивания и история обновлений.",
};

export default async function ReleasesPage() {
  const rel = await getReleasesPayload();
  const liveManifest = await fetchPublishedApkManifest();
  const manifestUrl = process.env.NEXT_PUBLIC_APK_MANIFEST_URL?.trim() ?? "";

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20">
      <h1 className="text-3xl font-bold text-white md:text-4xl">Обновления приложения</h1>
      <p className="mt-3 text-sm text-slate-400">
        Обновлено: <time dateTime={rel.lastUpdated}>{rel.lastUpdated}</time>
      </p>
      <p className="mt-2 text-xs text-slate-400">
        Технические подробности —{" "}
        <Link href={ecosystemRoutes.control} className="text-cyan-400 hover:underline">
          в центре управления
        </Link>
        .
      </p>

      <section className="mt-10 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.06] p-6 md:p-8">
        <h2 className="text-sm font-bold uppercase tracking-widest text-emerald-300/90">
          Актуальная версия для скачивания
        </h2>
        <p className="mt-2 font-mono text-xs text-slate-500 break-all">
          Источник обновлений: {manifestUrl || "пока не настроен"}
        </p>
        {liveManifest ? (
          <div className="mt-4 space-y-2 text-sm text-slate-300">
            <p>
              Последняя: <span className="font-mono text-white">{liveManifest.latestVersion}</span> · минимальная:{" "}
              <span className="font-mono text-white">{liveManifest.minimumSupported}</span>
            </p>
            {liveManifest.runtimeVersion ? (
              <p>
                Среда: <span className="font-mono text-cyan-300">{liveManifest.runtimeVersion}</span>
              </p>
            ) : null}
            <p className="break-all text-xs text-slate-500">{liveManifest.apkUrl}</p>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-400">
            {manifestUrl
              ? "Источник обновлений задан, но сейчас недоступен — данные подтянутся позже."
              : "Источник обновлений пока не настроен — версия появится после первой публикации."}
          </p>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-bold uppercase tracking-widest text-cyan-400/90">Каналы</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {rel.channels.map((c: ReleaseChannel) => (
            <div key={c.id} className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h3 className="text-lg font-semibold text-white">{c.label}</h3>
              <p className="mt-2 text-sm text-slate-400">{c.description}</p>
              <p className="mt-4 text-sm text-slate-300">
                Версия приложения (из репо Driver):{" "}
                <span className="font-mono text-cyan-300">{c.appVersion}</span>
              </p>
              <p className="mt-2 break-words text-xs text-slate-500">{c.notes}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-14 rounded-2xl border border-violet-500/20 bg-violet-500/[0.06] p-6 md:p-8">
        <h2 className="text-sm font-bold uppercase tracking-widest text-violet-300/90">Как приходят обновления</h2>
        <p className="mt-3 text-slate-300">{rel.apk.policy}</p>
        <p className="mt-4 text-sm text-slate-400">
          Известная версия APK-линии:{" "}
          <span className="font-mono text-white">{rel.apk.latestKnownVersion}</span>
        </p>
        <p className="mt-2 break-words text-xs text-slate-500">{rel.apk.note}</p>
        <p className="mt-2 break-all font-mono text-xs text-slate-500">
          Адрес файла обновлений:{" "}
          {rel.apk.publicManifestUrl === null ? "пока не настроено" : rel.apk.publicManifestUrl}
        </p>
      </section>

      <section className="mt-14">
        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">История обновлений</h2>
        <ul className="mt-4 space-y-3">
          {rel.history.map((h: ReleasesPayload["history"][number]) => (
            <li key={h.title + h.date} className="min-w-0 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
              <p className="text-xs text-slate-500">
                {h.date} · {h.type}
              </p>
              <p className="font-medium text-slate-200">{h.title}</p>
              <p className="mt-1 break-words text-sm text-slate-500">{h.detail}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
