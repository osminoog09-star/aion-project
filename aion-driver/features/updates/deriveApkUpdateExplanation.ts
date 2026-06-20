import type { ApkUpdateManifest } from "../../src/core/updates/apkManifest.types";
import type { ApkUpdateEvaluation } from "../../src/core/updates/apkUpdatePolicy";

export type ApkUpdateExplanation = {
  title: string;
  detail: string;
  actionLabel: string;
  mandatory: boolean;
};

export function deriveApkUpdateExplanation(input: {
  manifest: ApkUpdateManifest;
  evaluation: ApkUpdateEvaluation;
}): ApkUpdateExplanation {
  const { manifest, evaluation } = input;

  if (evaluation.reason === "below_minimum") {
    return {
      title: "Требуется новый APK",
      detail: `Текущая версия ниже минимально поддерживаемой (${manifest.minimumSupported}). OTA не заменит нативный слой.`,
      actionLabel: "Скачать обязательный APK",
      mandatory: true,
    };
  }

  if (evaluation.reason === "runtime_mismatch") {
    return {
      title: evaluation.critical ? "Требуется совместимый APK" : "Нужен совместимый APK",
      detail:
        "Runtime приложения не совпадает с политикой релиза. Установите полную сборку один раз, чтобы снова получать совместимые OTA-обновления.",
      actionLabel: "Скачать совместимый APK",
      mandatory: evaluation.critical,
    };
  }

  if (evaluation.reason === "newer_available") {
    return {
      title: evaluation.critical ? "Обязательное обновление APK" : "Доступна новая полная сборка",
      detail: evaluation.critical
        ? `Политика релиза требует версию ${manifest.latestVersion}. OTA не обновляет нативный слой.`
        : `На сервере версия ${manifest.latestVersion}. Её можно установить позже; OTA продолжает обновлять JS при совместимом runtime.`,
      actionLabel: evaluation.critical ? "Скачать обязательный APK" : "Скачать APK",
      mandatory: evaluation.critical,
    };
  }

  return {
    title: "APK не требуется",
    detail: "Установленная сборка соответствует политике релиза.",
    actionLabel: "Скачать APK",
    mandatory: false,
  };
}
