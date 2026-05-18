import * as Clipboard from "expo-clipboard";
import { useCallback, useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { GradientButton } from "../../components/ui/GradientButton";
import { useAuth } from "../auth/hooks/useAuth";
import { diagLog } from "../../lib/diagnosticLog";
import {
  buildBugReportDiagnostics,
  formatBugReportText,
  type BugReportCategory,
} from "./buildBugReportBundle";
import { submitBugReport } from "./submitBugReport";

const CATEGORIES: { id: BugReportCategory; label: string }[] = [
  { id: "fuel", label: "Топливо / расчёт" },
  { id: "sync", label: "Синхронизация" },
  { id: "ui", label: "Интерфейс" },
  { id: "crash", label: "Вылет / зависание" },
  { id: "bug", label: "Ошибка" },
  { id: "other", label: "Другое" },
];

export function BugReportModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { session, isGuest } = useAuth();
  const userId = session?.user?.id && !isGuest ? session.user.id : null;
  const [category, setCategory] = useState<BugReportCategory>("bug");
  const [description, setDescription] = useState("");
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const loadPreview = useCallback(async () => {
    setBusy(true);
    try {
      const d = await buildBugReportDiagnostics();
      setPreview(formatBugReportText(category, description, d));
    } finally {
      setBusy(false);
    }
  }, [category, description]);

  useEffect(() => {
    if (!visible) return;
    setResult(null);
    void loadPreview();
  }, [visible, loadPreview]);

  const onSubmit = async () => {
    setBusy(true);
    setResult(null);
    const res = await submitBugReport({
      userId,
      category,
      description,
    });
    setBusy(false);
    if (res.ok) {
      setResult(`Отправлено · id ${res.id.slice(0, 8)}…`);
      diagLog("info", "bug_report", "Пользователь отправил отчёт", { id: res.id });
    } else {
      setResult(res.message);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 justify-end bg-black/60">
        <Pressable className="flex-1" onPress={onClose} />
        <View className="max-h-[92%] rounded-t-3xl border border-white/10 bg-slate-950 px-4 pb-8 pt-4">
          <Text className="text-lg font-semibold text-white">Сообщить о проблеме</Text>
          <Text className="mt-1 text-sm text-slate-400">
            Опишите что случилось — отчёт уйдёт в облако с журналом для разбора.
          </Text>

          <ScrollView className="mt-4 max-h-[70%]" keyboardShouldPersistTaps="handled">
            <Text className="text-[10px] uppercase tracking-widest text-slate-500">Категория</Text>
            <View className="mt-2 flex-row flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <Pressable
                  key={c.id}
                  onPress={() => setCategory(c.id)}
                  className={`rounded-full border px-3 py-1.5 ${
                    category === c.id
                      ? "border-cyan-400/50 bg-cyan-500/15"
                      : "border-white/10 bg-white/5"
                  }`}
                >
                  <Text
                    className={`text-[11px] font-semibold ${
                      category === c.id ? "text-cyan-200" : "text-slate-400"
                    }`}
                  >
                    {c.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text className="mt-4 text-[10px] uppercase tracking-widest text-slate-500">
              Что пошло не так?
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Например: неверно посчитало бензин после заправки…"
              placeholderTextColor="#64748b"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              className="mt-2 min-h-[100px] rounded-xl border border-white/10 bg-slate-950/80 px-3 py-3 text-sm text-white"
            />

            {!userId ? (
              <Text className="mt-3 text-xs text-amber-300/90">
                Без входа отчёт можно только скопировать — войдите для отправки в облако.
              </Text>
            ) : null}

            {result ? (
              <Text
                className={`mt-3 text-xs ${result.startsWith("Отправлено") ? "text-emerald-300" : "text-rose-300"}`}
              >
                {result}
              </Text>
            ) : null}

            <Text className="mt-4 text-[10px] uppercase tracking-widest text-slate-500">
              Диагностика (для разработки)
            </Text>
            <View className="mt-2 max-h-40 rounded-xl border border-white/10 bg-black/30 p-2">
              <Text selectable className="font-mono text-[10px] text-slate-400">
                {busy && !preview ? "Сбор…" : preview.slice(0, 4000)}
                {preview.length > 4000 ? "\n…" : ""}
              </Text>
            </View>
          </ScrollView>

          <View className="mt-4 gap-2">
            <GradientButton
              title={userId ? "Отправить в облако" : "Нужен вход для отправки"}
              onPress={() => void onSubmit()}
              loading={busy}
              disabled={!userId || description.trim().length < 3}
              size="cockpit"
            />
            <GradientButton
              title="Обновить превью"
              variant="glass"
              onPress={() => void loadPreview()}
              loading={busy}
              size="cockpit"
            />
            <GradientButton
              title="Скопировать всё"
              variant="glass"
              onPress={async () => {
                const d = await buildBugReportDiagnostics();
                const t = formatBugReportText(category, description, d);
                await Clipboard.setStringAsync(t);
                setResult("Скопировано в буфер");
              }}
              size="cockpit"
            />
            <GradientButton title="Закрыть" variant="ghost" onPress={onClose} size="cockpit" />
          </View>
        </View>
      </View>
    </Modal>
  );
}
