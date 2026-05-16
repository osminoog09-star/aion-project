/**
 * Диагностика: что может OTA, что только APK (native / manifest / overlay).
 */
export type RuntimeCompatibilityInput = {
  dev: boolean;
  otaEnabled: boolean;
  appVersion: string | null;
  embeddedRuntimeVersion: string | null;
  manifestRuntimeVersion: string | null | undefined;
};

export type RuntimeCompatibilityPanel = {
  otaJsOnly: boolean;
  apkRequiredForRuntimeMismatch: boolean;
  headline: string;
  bullets: string[];
};

export function deriveRuntimeCompatibilityPanel(
  input: RuntimeCompatibilityInput,
): RuntimeCompatibilityPanel {
  const bullets: string[] = [];
  if (input.dev) {
    bullets.push("Режим разработки: OTA не применяется; проверки релиза — только в EAS-сборке.");
  } else if (!input.otaEnabled) {
    bullets.push("OTA (expo-updates) выключен в этой сборке — обновления только через новый APK.");
  } else {
    bullets.push(
      "OTA обновляет JS/UI при совпадении runtimeVersion с каналом; Kotlin, overlay, manifest, сервисы — только новый APK.",
    );
  }

  const er = input.embeddedRuntimeVersion?.trim() || null;
  const mr = input.manifestRuntimeVersion?.trim() || null;
  let apkRequiredForRuntimeMismatch = false;
  if (mr && er && mr !== er) {
    apkRequiredForRuntimeMismatch = true;
    bullets.push(
      `Несовпадение runtime: устройство «${er}», манифест APK «${mr}» — OTA не выровняет нативный слой.`,
    );
  }

  const otaJsOnly = !input.dev && input.otaEnabled && !apkRequiredForRuntimeMismatch;

  const headline = apkRequiredForRuntimeMismatch
    ? "Нужен APK: несовпадение runtime"
    : input.dev
      ? "Режим разработки"
      : "OTA = JS; APK = native";

  return {
    otaJsOnly,
    apkRequiredForRuntimeMismatch,
    headline,
    bullets,
  };
}
