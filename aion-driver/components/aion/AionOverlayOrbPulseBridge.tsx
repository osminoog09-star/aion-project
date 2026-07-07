import { useEffect, useRef } from "react";
import { useRuntimePulse } from "../../src/core/aion/runtime/runtimePulseBus";
import {
  OVERLAY_ORB_NATIVE_PRODUCTION_READY,
  isAionOverlayOrbNativeAvailable,
  orbNativePulse,
} from "../../services/aionOverlayOrbNative";

/**
 * Пробрасывает живые тики runtimePulse → native overlay orb (короткий вспых поверх постоянной
 * breath/orbit анимации). Компонент-сирота без UI — монтируется один раз в _layout.tsx.
 *
 * Логика дельт: подписываемся на zustand-store и сравниваем счётчики; первое значение фиксируем
 * без вспышки чтобы не «выстреливать» при старте.
 */
export function AionOverlayOrbPulseBridge() {
  const lastRef = useRef<{
    upload: number;
    gps: number;
    error: number;
    recovery: number;
    aiThink: number;
    sync: number;
    profit: number;
  } | null>(null);

  useEffect(() => {
    if (!OVERLAY_ORB_NATIVE_PRODUCTION_READY || !isAionOverlayOrbNativeAvailable()) return;
    const unsub = useRuntimePulse.subscribe((s) => {
      const next = {
        upload: s.uploadTick,
        gps: s.gpsTick,
        error: s.errorTick,
        recovery: s.recoveryTick,
        aiThink: s.aiThinkTick,
        sync: s.networkTick,
        profit: s.profitTick,
      };
      const prev = lastRef.current;
      lastRef.current = next;
      if (!prev) return;
      if (next.error > prev.error) {
        void orbNativePulse("error");
        return;
      }
      if (next.recovery > prev.recovery) {
        void orbNativePulse("recovery");
        return;
      }
      if (next.upload > prev.upload) {
        void orbNativePulse("upload");
        return;
      }
      if (next.aiThink > prev.aiThink) {
        void orbNativePulse("ai_think");
        return;
      }
      if (next.gps > prev.gps) {
        void orbNativePulse("gps");
        return;
      }
      if (next.sync > prev.sync) {
        void orbNativePulse("sync");
        return;
      }
      if (next.profit > prev.profit) {
        void orbNativePulse("profit");
      }
    });
    return () => {
      unsub();
    };
  }, []);

  return null;
}
