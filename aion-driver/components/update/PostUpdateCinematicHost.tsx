import * as Updates from "expo-updates";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useState } from "react";
import { AccessibilityInfo, Modal, Pressable, Text, View } from "react-native";
import {
  clearPostUpdateCelebrationPending,
  peekPostUpdateCelebrationPending,
} from "../../features/updates/postUpdateCelebration";
import type { UpdateManifestSummary } from "../../services/updateService";
import { useAionEntityStore } from "../../src/core/aion/entity/aionEntityStore";

function isSummary(v: unknown): v is UpdateManifestSummary {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return "bundleParts" in o && typeof o.bundleParts === "number";
}

export function PostUpdateCinematicHost() {
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState<UpdateManifestSummary | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const triggerSuccess = useAionEntityStore((s) => s.triggerSuccess);

  useEffect(() => {
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    return () => {
      sub.remove();
    };
  }, []);

  useEffect(() => {
    void (async () => {
      const p = await peekPostUpdateCelebrationPending();
      if (!p) return;
      if (p.summary && isSummary(p.summary)) {
        setSummary(p.summary);
      }
      setOpen(true);
    })();
  }, []);

  const onClose = useCallback(async () => {
    await clearPostUpdateCelebrationPending();
    setOpen(false);
    triggerSuccess(3200);
  }, [triggerSuccess]);

  if (!open) return null;

  const ver = Constants.expoConfig?.version ?? "—";
  const rt = Updates.runtimeVersion != null ? String(Updates.runtimeVersion) : "—";
  const uid = Updates.updateId ?? "—";

  return (
    <Modal animationType="fade" transparent visible onRequestClose={() => void onClose()}>
      <Pressable className="flex-1 justify-end bg-black/80" onPress={() => void onClose()}>
        <Pressable
          className="overflow-hidden rounded-t-3xl border border-cyan-500/25"
          onPress={(e) => e.stopPropagation()}
        >
          <LinearGradient
            colors={["#0f172a", "#020617"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ paddingHorizontal: 22, paddingTop: 28, paddingBottom: 36 }}
          >
            <Text className="text-center text-[10px] font-bold uppercase tracking-[0.45em] text-cyan-300/90">
              AION Updated
            </Text>
            <Text
              className="mt-4 text-center text-2xl font-semibold text-white"
              style={reduceMotion ? undefined : { transform: [{ scale: 1.02 }] }}
            >
              Система обновлена
            </Text>
            <Text className="mt-3 text-center text-sm leading-5 text-slate-400">
              Активная версия: <Text className="font-mono text-cyan-200">{ver}</Text>
              {"\n"}
              Runtime: <Text className="font-mono text-cyan-200">{rt}</Text>
              {"\n"}
              OTA updateId: <Text className="font-mono text-xs text-slate-300">{uid}</Text>
            </Text>
            {summary?.releaseMessage ? (
              <Text className="mt-4 text-center text-sm text-slate-300">{summary.releaseMessage}</Text>
            ) : null}
            {summary?.newFeatures?.length ? (
              <View className="mt-4">
                <Text className="text-xs font-bold uppercase tracking-wider text-emerald-400/90">Главное</Text>
                {summary.newFeatures.slice(0, 4).map((x) => (
                  <Text key={x} className="mt-1 text-sm text-slate-300">
                    • {x}
                  </Text>
                ))}
              </View>
            ) : null}
            <Pressable
              onPress={() => void onClose()}
              className="mt-8 items-center rounded-2xl bg-cyan-500/20 py-3"
              accessibilityRole="button"
              accessibilityLabel="Закрыть поздравление об обновлении"
            >
              <Text className="text-sm font-semibold text-cyan-100">Продолжить</Text>
            </Pressable>
            <Text className="mt-3 text-center text-[10px] text-slate-600">
              Полный список изменений — в Центре обновлений
            </Text>
          </LinearGradient>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
