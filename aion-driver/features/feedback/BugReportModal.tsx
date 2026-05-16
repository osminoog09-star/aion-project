import Constants from "expo-constants";
import * as Updates from "expo-updates";
import * as Clipboard from "expo-clipboard";
import { useCallback, useEffect, useState } from "react";
import { Modal, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { GradientButton } from "../../components/ui/GradientButton";
import { peekSyncQueue } from "../../features/sync/services/offlineQueue";
import { getOtaDebugInfo } from "../../services/updateService";

async function buildBugReportBody(): Promise<string> {
  const ota = getOtaDebugInfo();
  const queue = await peekSyncQueue();
  const extra = Constants.expoConfig?.extra as Record<string, unknown> | undefined;
  const lines = [
    `AION Driver · bug report`,
    `Platform: ${Platform.OS} ${String(Platform.Version)}`,
    `Device: ${Constants.deviceName ?? "unknown"}`,
    `App version: ${Constants.expoConfig?.version ?? "?"}`,
    `OTA enabled: ${ota.enabled}`,
    `OTA channel: ${ota.channel ?? "—"}`,
    `OTA runtime: ${ota.runtimeVersion ?? "—"}`,
    `OTA updateId: ${ota.updateId ?? "—"}`,
    `Updates.isEmbeddedLaunch: ${Updates.isEmbeddedLaunch}`,
    `Sync queue length: ${queue.length}`,
    `Expo slug: ${Constants.expoConfig?.slug ?? "?"}`,
    extra?.eas ? `EAS project: ${JSON.stringify(extra.eas)}` : null,
    "",
    "Опишите шаги воспроизведения ниже (вручную после копирования).",
  ];
  return lines.filter(Boolean).join("\n");
}

export function BugReportModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const t = await buildBugReportBody();
      setBody(t);
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    setCopied(false);
    void load();
  }, [visible, load]);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 justify-end bg-black/60">
        <Pressable className="flex-1" onPress={onClose} />
        <View className="max-h-[85%] rounded-t-3xl border border-white/10 bg-slate-950 px-4 pb-8 pt-4">
          <Text className="text-lg font-semibold text-white">Сообщить о проблеме</Text>
          <Text className="mt-1 text-sm text-slate-400">
            Копируйте блок в буфер и отправьте в поддержку / Telegram / email.
          </Text>
          <ScrollView className="mt-4 max-h-80 rounded-2xl border border-white/10 bg-black/30 p-3">
            <Text selectable className="font-mono text-xs text-slate-300">
              {busy ? "Сбор данных…" : body || "…"}
            </Text>
          </ScrollView>
          <View className="mt-4 gap-3">
            <GradientButton
              title="Обновить данные"
              variant="glass"
              onPress={() => void load()}
              loading={busy}
              size="cockpit"
            />
            <GradientButton
              title={copied ? "Скопировано" : "Копировать в буфер"}
              onPress={async () => {
                const t = body || (await buildBugReportBody());
                await Clipboard.setStringAsync(t);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              disabled={busy}
              size="cockpit"
            />
            <GradientButton title="Закрыть" variant="ghost" onPress={onClose} size="cockpit" />
          </View>
        </View>
      </View>
    </Modal>
  );
}
