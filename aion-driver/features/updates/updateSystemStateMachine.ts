import type { UpdateUiPhase } from "../../hooks/useUpdatesController";
import type { ApkUpdateReason } from "../../src/core/updates/useApkUpdateController";
import type { ApkUpdateManifest } from "../../src/core/updates/apkManifest.types";
import { deriveApkUpdateExplanation } from "./deriveApkUpdateExplanation";

export type UpdateEngineState =
  | "idle"
  | "checking"
  | "downloading"
  | "applying"
  | "downloaded"
  | "pending_restart"
  | "success"
  | "failed"
  | "offline"
  | "runtime_mismatch"
  | "apk_required"
  | "apk_recommended"
  | "rollback"
  | "stale_manifest"
  | "manifest_failed";

export type UpdateEngineView = {
  state: UpdateEngineState;
  headline: string;
  detail: string;
  badges: string[];
};

export type UpdateMachineInput = {
  dev: boolean;
  otaEnabled: boolean;
  netOnline: boolean;
  otaPhase: UpdateUiPhase;
  otaError: string | null;
  embeddedLaunch: boolean;
  emergencyLaunch: boolean;
  manifestUrlConfigured: boolean;
  apkLoading: boolean;
  apkManifest: ApkUpdateManifest | null;
  apkEval: { reason: ApkUpdateReason; critical: boolean } | null;
  apkManifestStale: boolean;
  apkLastErrorAtMs: number | null;
  apkFromCache: boolean;
};

function mapApkState(
  ev: { reason: ApkUpdateReason; critical: boolean },
  manifest: ApkUpdateManifest,
  manifestStale: boolean,
  fromCache: boolean,
): UpdateEngineView {
  const explanation = deriveApkUpdateExplanation({ manifest, evaluation: ev });
  const st: UpdateEngineState = ev.critical
    ? ev.reason === "runtime_mismatch"
      ? "runtime_mismatch"
      : "apk_required"
    : ev.reason === "runtime_mismatch"
      ? "runtime_mismatch"
      : "apk_recommended";
  const warnings = [
    manifestStale ? "манифест давно не обновлялся на сервере" : null,
    fromCache ? "свежий манифест не получен; решение основано на локальных данных" : null,
  ].filter((value): value is string => value != null);
  return {
    state: st,
    headline: explanation.title,
    detail: warnings.length ? `${explanation.detail} · ${warnings.join(" · ")}.` : explanation.detail,
    badges: ["apk", ev.reason, ...(fromCache ? ["cache"] : [])],
  };
}

/**
 * Единый источник правды для UI обновлений: OTA (expo-updates) + APK-манифест + сеть.
 * Приоритет: активные фазы OTA → критичный APK → OTA prompt → рекомендации APK → прочее.
 */
export function deriveUpdateEngineView(input: UpdateMachineInput): UpdateEngineView {
  const badges: string[] = [];

  if (input.dev) {
    return {
      state: "idle",
      headline: "Режим разработки",
      detail: "OTA и манифест APK не применяются в __DEV__. Соберите EAS build для реальных проверок.",
      badges: ["__DEV__"],
    };
  }

  if (input.emergencyLaunch) {
    badges.push("emergency");
    return {
      state: "rollback",
      headline: "Аварийный откат",
      detail: "Запущена встроенная сборка (emergency). OTA мог быть отклонён.",
      badges,
    };
  }

  if (input.embeddedLaunch && input.otaEnabled) {
    badges.push("embedded");
  }

  if (input.manifestUrlConfigured && !input.apkLoading && !input.apkManifest && input.apkLastErrorAtMs) {
    return {
      state: "manifest_failed",
      headline: "Манифест APK недоступен",
      detail: "Проверьте URL, TLS и JSON. Повтор при возврате в приложение.",
      badges: [...badges, "apk"],
    };
  }

  if (!input.netOnline && (input.otaPhase === "checking" || input.otaPhase === "downloading")) {
    return {
      state: "offline",
      headline: "Нет сети",
      detail: "Проверка или загрузка OTA не завершится без подключения.",
      badges: [...badges, "offline"],
    };
  }

  if (input.otaEnabled) {
    switch (input.otaPhase) {
      case "checking":
        return { state: "checking", headline: "Проверка OTA", detail: "Запрос к серверу обновлений…", badges };
      case "downloading":
        return {
          state: "downloading",
          headline: "Загрузка OTA",
          detail: "Скачивается JS-бандл. После завершения потребуется перезапуск.",
          badges: [...badges, "ota"],
        };
      case "ready":
        return {
          state: "pending_restart",
          headline: "OTA готов",
          detail: "Обновление скачано. Перезапустите приложение, чтобы применить.",
          badges: [...badges, "ota"],
        };
      case "error":
        return {
          state: "failed",
          headline: "Ошибка OTA",
          detail: input.otaError ?? "Не удалось проверить или загрузить обновление.",
          badges: [...badges, "ota"],
        };
      default:
        break;
    }
  }

  if (input.apkManifest && input.apkEval && input.apkEval.reason !== "none" && input.apkEval.critical) {
    const v = mapApkState(input.apkEval, input.apkManifest, input.apkManifestStale, input.apkFromCache);
    return { ...v, badges: [...badges, ...v.badges] };
  }

  if (input.otaEnabled && input.otaPhase === "prompt") {
    return {
      state: "downloaded",
      headline: "Доступно OTA-обновление",
      detail: "Новый JS/UI на канале. Можно загрузить и перезапустить.",
      badges: [...badges, "ota"],
    };
  }

  if (input.apkManifest && input.apkEval && input.apkEval.reason !== "none") {
    const v = mapApkState(input.apkEval, input.apkManifest, input.apkManifestStale, input.apkFromCache);
    return { ...v, badges: [...badges, ...v.badges] };
  }

  if (input.apkFromCache && input.apkManifest && input.apkLastErrorAtMs) {
    return {
      state: "stale_manifest",
      headline: "Показаны локальные данные APK",
      detail: "Свежий манифест с сервера не получен. Повторите проверку перед установкой полной сборки.",
      badges: [...badges, "apk", "cache"],
    };
  }

  if (input.apkManifestStale && input.apkManifest) {
    return {
      state: "stale_manifest",
      headline: "Манифест устарел",
      detail: "JSON манифеста не менялся дольше допустимого — проверьте публикацию релизов.",
      badges: [...badges, "apk"],
    };
  }

  if (!input.otaEnabled) {
    return {
      state: "idle",
      headline: "OTA выключены",
      detail: "Сборка без expo-updates или отключено в конфигурации.",
      badges,
    };
  }

  return {
    state: "idle",
    headline: "Система обновлений",
    detail: "Нет активных операций OTA. APK соответствует политике.",
    badges,
  };
}
