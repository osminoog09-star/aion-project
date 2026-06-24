import { router } from "expo-router";
import { useCallback, useState } from "react";
import { GradientButton } from "../ui/GradientButton";
import { AppConfirmModal } from "../feedback/AppConfirmModal";
import { useShift } from "../../hooks/useShift";
import { useResolvedCurrency } from "../../hooks/useResolvedCurrency";
import { formatCurrencyDisplay } from "../../utils/formatting";
import { buildManualFuelEntry } from "../../utils/fuelEntryFromManual";
import { useVoiceCapture } from "../../features/voice/useVoiceCapture";
import type { VoiceCommand } from "../../features/voice/parseVoiceCommand";
import type { AppCurrencyCode } from "../../types/device";

function confirmMessage(cmd: VoiceCommand, currency: AppCurrencyCode): string {
  switch (cmd.kind) {
    case "income":
      return `Записать доход ${formatCurrencyDisplay(cmd.amount, currency)}?`;
    case "fuel":
      return cmd.liters != null
        ? `Заправка ${formatCurrencyDisplay(cmd.amount, currency)} · ${cmd.liters} л — записать?`
        : `Заправка на ${formatCurrencyDisplay(cmd.amount, currency)} — открыть экран, чтобы указать литры?`;
    case "shift":
      return {
        start: "Начать смену?",
        end: "Закончить смену?",
        pause: "Поставить смену на паузу?",
        resume: "Продолжить смену?",
      }[cmd.action];
  }
}

/** Кнопка голосового ввода: «доход 1200», «заправка 3000 45», «начать смену» и т.п. */
export function VoiceCommandButton() {
  const {
    addIncome,
    addConfirmedFuelEntry,
    startShift,
    endShift,
    pauseShift,
    resumeShift,
  } = useShift();
  const currency = useResolvedCurrency();
  const [pending, setPending] = useState<VoiceCommand | null>(null);

  const { listening, error, start, clearError } = useVoiceCapture(
    useCallback((cmd: VoiceCommand) => setPending(cmd), []),
  );

  const apply = useCallback(async () => {
    const cmd = pending;
    setPending(null);
    if (!cmd) return;
    if (cmd.kind === "income") {
      await addIncome(cmd.amount);
      return;
    }
    if (cmd.kind === "fuel") {
      if (cmd.liters != null) {
        const entry = buildManualFuelEntry({
          totalCost: cmd.amount,
          liters: cmd.liters,
          fuelType: "АИ-95",
        });
        if (entry) await addConfirmedFuelEntry(entry);
      } else {
        router.push("/add-fuel");
      }
      return;
    }
    if (cmd.action === "start") await startShift();
    else if (cmd.action === "end") await endShift();
    else if (cmd.action === "pause") await pauseShift();
    else await resumeShift();
  }, [
    pending,
    addIncome,
    addConfirmedFuelEntry,
    startShift,
    endShift,
    pauseShift,
    resumeShift,
  ]);

  return (
    <>
      <GradientButton
        title={listening ? "Слушаю…" : "🎤 Голос"}
        variant="glass"
        size="cockpit"
        onPress={() => void start()}
        loading={listening}
      />
      <AppConfirmModal
        visible={pending != null}
        title="Голосовая команда"
        message={pending ? confirmMessage(pending, currency) : ""}
        confirmLabel="Применить"
        cancelLabel="Отмена"
        onConfirm={() => void apply()}
        onCancel={() => setPending(null)}
      />
      <AppConfirmModal
        visible={error != null}
        title="Голосовой ввод"
        message={error ?? ""}
        confirmLabel="Понятно"
        cancelLabel={null}
        onConfirm={clearError}
        onCancel={clearError}
      />
    </>
  );
}
