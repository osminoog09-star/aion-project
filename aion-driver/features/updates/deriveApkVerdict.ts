import type { ApkUpdateManifest } from "../../src/core/updates/apkManifest.types";
import type { ApkUpdateEvaluation } from "../../src/core/updates/apkUpdatePolicy";
import { deriveApkUpdateExplanation } from "./deriveApkUpdateExplanation";

export type ApkVerdict = {
  headline: string;
  detail: string;
  apkBlock: boolean;
  rolloutPaused: boolean;
};

export function deriveApkVerdict(input: {
  manifestConfigured: boolean;
  loading: boolean;
  manifest: ApkUpdateManifest | null;
  evaluation: ApkUpdateEvaluation | null;
}): ApkVerdict {
  if (!input.manifestConfigured) {
    return {
      headline: "Манифест APK не подключён",
      detail:
        "Задайте EXPO_PUBLIC_APK_MANIFEST_URL на JSON (latestVersion, minimumSupported, apkUrl, runtimeVersion). Тогда приложение сравнит версию и runtime.",
      apkBlock: false,
      rolloutPaused: false,
    };
  }
  if (input.loading && !input.manifest) {
    return { headline: "Проверка манифеста APK…", detail: "", apkBlock: false, rolloutPaused: false };
  }
  if (!input.manifest || !input.evaluation) {
    return {
      headline: "Манифест APK недоступен",
      detail: "Проверьте сеть и URL.",
      apkBlock: false,
      rolloutPaused: false,
    };
  }
  const { reason } = input.evaluation;
  if (reason === "none" && input.manifest.rolloutState === "paused") {
    return {
      headline: "Выпуск APK приостановлен",
      detail: `Сервер временно остановил rollout версии ${input.manifest.latestVersion}. Обязательного обновления сейчас нет.`,
      apkBlock: false,
      rolloutPaused: true,
    };
  }
  if (reason === "none") {
    return {
      headline: "Полная сборка: актуально",
      detail: `Сервер: latest ${input.manifest.latestVersion}, minimum ${input.manifest.minimumSupported}.`,
      apkBlock: false,
      rolloutPaused: false,
    };
  }
  const explanation = deriveApkUpdateExplanation({ manifest: input.manifest, evaluation: input.evaluation });
  return {
    headline: explanation.title,
    detail: explanation.detail,
    apkBlock: true,
    rolloutPaused: false,
  };
}
