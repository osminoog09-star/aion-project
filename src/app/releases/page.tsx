import type { Metadata } from "next";
import { getReleasesPayload } from "@/lib/ecosystem-data";
import { fetchPublishedApkManifest } from "@/lib/fetchApkManifest";

export const metadata: Metadata = {
  title: "Релизы — OTA, APK, каналы",
  description: "Политика обновлений и зафиксированные версии; manifest APK добавится после публикации артефактов.",
};

export default async function ReleasesPage() {
  const rel = await getReleasesPayload();
  const liveManifest = await fetchPublishedApkManifest();
  const manifestUrl = process.env.NEXT_PUBLIC_APK_MANIFEST_URL?.trim() ?? "";

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20">
      <h1 className="text-3xl font-bold text-white md:text-4xl">Release center</h1>
      <p className="mt-3 text-sm text-slate-500">
        Обновлено: <time dateTime={rel.lastUpdated}>{rel.lastUpdated}</time>
      </p>

      <section className="mt-10 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.06] p-6 md:p-8">
        <h2 className="text-sm font-bold uppercase tracking-widest text-emerald-300/90">
          Живой манифест APK (если задан URL)
        </h2>
        <p className="mt-2 font-mono text-xs text-slate-500 break-all">
          NEXT_PUBLIC_APK_MANIFEST_URL: {manifestUrl || "(не задан — см. деплой Vercel / .env)"}
        </p>
        {liveManifest ? (
          <div className="mt-4 space-y-2 text-sm text-slate-300">
            <p>
              latest: <span className="font-mono text-white">{liveManifest.latestVersion}</span> · minimum:{" "}
              <span className="font-mono text-white">{liveManifest.minimumSupported}</span>
            </p>
            {liveManifest.runtimeVersion ? (
              <p>
                runtime: <span className="font-mono text-cyan-300">{liveManifest.runtimeVersion}</span>
              </p>
            ) : null}
            <p className="break-all text-xs text-slate-500">{liveManifest.apkUrl}</p>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">
            {manifestUrl
              ? "URL задан, но ответ не прошёл валидацию или сеть недоступна на сборке."
              : "Задайте тот же URL, что и EXPO_PUBLIC_APK_MANIFEST_URL в AION Driver — сайт подтянет актуальный JSON."}
          </p>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-bold uppercase tracking-widest text-cyan-400/90">Каналы</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {rel.channels.map((c) => (
            <div key={c.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h3 className="text-lg font-semibold text-white">{c.label}</h3>
              <p className="mt-2 text-sm text-slate-400">{c.description}</p>
              <p className="mt-4 text-sm text-slate-300">
                Версия приложения (из репо Driver):{" "}
                <span className="font-mono text-cyan-300">{c.appVersion}</span>
              </p>
              <p className="mt-2 text-xs text-slate-500">{c.notes}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-14 rounded-2xl border border-violet-500/20 bg-violet-500/[0.06] p-6 md:p-8">
        <h2 className="text-sm font-bold uppercase tracking-widest text-violet-300/90">APK vs OTA</h2>
        <p className="mt-3 text-slate-300">{rel.apk.policy}</p>
        <p className="mt-4 text-sm text-slate-400">
          Известная версия APK-линии:{" "}
          <span className="font-mono text-white">{rel.apk.latestKnownVersion}</span>
        </p>
        <p className="mt-2 text-xs text-slate-500">{rel.apk.note}</p>
        <p className="mt-2 font-mono text-xs text-slate-600">
          manifest URL (статический JSON в репо):{" "}
          {rel.apk.publicManifestUrl === null ? "null (не настроено)" : rel.apk.publicManifestUrl}
        </p>
      </section>

      <section className="mt-14">
        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500">История (факт)</h2>
        <ul className="mt-4 space-y-3">
          {rel.history.map((h) => (
            <li key={h.title + h.date} className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
              <p className="text-xs text-slate-500">
                {h.date} · {h.type}
              </p>
              <p className="font-medium text-slate-200">{h.title}</p>
              <p className="mt-1 text-sm text-slate-500">{h.detail}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
