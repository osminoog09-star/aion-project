import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import {
  processNextOcrQueueItem,
  recoverInterruptedOcrJobs,
} from "../../features/import/ocrQueue/ocrQueueEngine";
import { subscribeOcrQueue } from "../../features/import/ocrQueue/ocrQueueEvents";
import { useRuntimePulse } from "../../src/core/aion/runtime/runtimePulseBus";

/**
 * Фоновый движок OCR-очереди: reconnect, backoff, stuck recovery, replay.
 */
export function OcrQueueProcessor() {
  const busy = useRef(false);

  useEffect(() => {
    let alive = true;

    const drain = async () => {
      if (!alive || busy.current) return;
      busy.current = true;
      useRuntimePulse.getState().pingAiThink();
      try {
        let more = true;
        let guard = 0;
        while (more && guard < 5) {
          guard += 1;
          more = await processNextOcrQueueItem();
        }
      } finally {
        busy.current = false;
      }
    };

    void recoverInterruptedOcrJobs()
      .catch(() => 0)
      .finally(() => void drain());
    const id = setInterval(() => void drain(), 12_000);
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") void drain();
    });
    const unsub = subscribeOcrQueue(() => {
      void drain();
    });

    return () => {
      alive = false;
      clearInterval(id);
      sub.remove();
      unsub();
    };
  }, []);

  return null;
}
