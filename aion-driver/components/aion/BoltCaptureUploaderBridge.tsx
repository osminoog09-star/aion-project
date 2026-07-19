import { useEffect } from "react";
import { AppState } from "react-native";
import {
  drainAndUploadBoltCapture,
} from "../../services/boltCaptureUpload";
import { isNotifCaptureAvailable } from "../../services/aionNotifCaptureNative";

const POLL_MS = 5000;

/**
 * Компонент-сирота без UI (монтируется один раз в _layout): пока приложение
 * на переднем плане и есть нативный модуль захвата — каждые 5с дренит буфер
 * пойманных текстов Bolt и заливает их в облако (для авто-настройки заказов).
 * Инертен, если модуля нет (старый APK) или доступ к уведомлениям/экрану не дан
 * (буфер пуст → заливать нечего).
 */
export function BoltCaptureUploaderBridge() {
  useEffect(() => {
    if (!isNotifCaptureAvailable()) return;
    let timer: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (timer) return;
      void drainAndUploadBoltCapture();
      timer = setInterval(() => void drainAndUploadBoltCapture(), POLL_MS);
    };
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };

    if (AppState.currentState === "active") start();
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") start();
      else stop();
    });
    return () => {
      stop();
      sub.remove();
    };
  }, []);

  return null;
}
