import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from "expo-speech-recognition";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PrimaryButton } from "../components/PrimaryButton";
import { parseDriverVoiceCommand } from "../features/voice/parseDriverVoiceCommand";
import { useOrderActivity } from "../hooks/useOrderActivity";
import { useShift } from "../hooks/useShift";
import { useResolvedCurrency } from "../hooks/useResolvedCurrency";
import { formatCurrencyDisplay } from "../utils/formatting";

/**
 * Активный экран голосового ввода. Статически импортит нативный
 * expo-speech-recognition — грузится ТОЛЬКО когда модуль есть в APK
 * (гейт в app/voice-control.tsx через requireOptionalNativeModule).
 */
export default function VoiceControlActiveScreen() {
  const { activeShift, addIncomeBatch, undoIncomeEntries } = useShift();
  const { beginPickup, beginOnOrder, endActivity } = useOrderActivity(activeShift?.id ?? null);
  const currency = useResolvedCurrency();
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [savedEntryIds, setSavedEntryIds] = useState<string[]>([]);
  const [orderMarkSaved, setOrderMarkSaved] = useState<string | null>(null);
  const [resultFinal, setResultFinal] = useState(false);
  const [resultConfidence, setResultConfidence] = useState<number | null>(null);
  const command = parseDriverVoiceCommand(transcript);
  const commandCurrency = command && command.kind !== "order_activity" ? command.currencyCode : null;
  const currencyMismatch = Boolean(commandCurrency && commandCurrency !== currency);
  const lowConfidence = resultConfidence != null && resultConfidence < 0.55;
  useSpeechRecognitionEvent("start", () => setListening(true));
  useSpeechRecognitionEvent("end", () => setListening(false));
  useSpeechRecognitionEvent("result", (event) => {
    const result = event.results[0];
    setTranscript(result?.transcript ?? "");
    if (event.isFinal) {
      setResultFinal(true);
      setResultConfidence(typeof result?.confidence === "number" && result.confidence > 0 ? result.confidence : null);
    }
  });
  useSpeechRecognitionEvent("nomatch", () => setError("Речь слышна, но команда не распознана."));
  useSpeechRecognitionEvent("error", (event) => {
    setListening(false);
    const message = event.error === "not-allowed"
      ? "Для голосового ввода нужен доступ к микрофону."
      : event.error === "network"
        ? "Нет связи с сервисом распознавания. Повторите команду позже."
        : event.error === "no-speech"
          ? "Речь не обнаружена. Нажмите микрофон и повторите команду."
          : "Не удалось распознать команду.";
    setError(message);
  });

  const start = async () => {
    setError(null); setTranscript(""); setResultFinal(false); setResultConfidence(null); setOrderMarkSaved(null);
    if (!ExpoSpeechRecognitionModule.isRecognitionAvailable()) { setError("Сервис распознавания речи недоступен."); return; }
    const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!permission.granted) { setError("Для голосового ввода нужен микрофон."); return; }
    ExpoSpeechRecognitionModule.start({ lang: "ru-RU", interimResults: true, continuous: false, maxAlternatives: 1, contextualStrings: ["добавь заказ", "заправился", "евро", "рублей", "подача", "везу", "высадил"] });
  };
  const confirm = async () => {
    if (!command || !resultFinal || lowConfidence || currencyMismatch) return;
    if (command.kind === "fuel") { router.replace({ pathname: "/add-fuel", params: { total: String(command.amount) } }); return; }
    if (!activeShift) { Alert.alert("Нет активной смены", "Сначала начните смену."); return; }
    if (command.kind === "order_activity") {
      if (command.action === "pickup") { beginPickup(); setOrderMarkSaved("Отмечена подача — километры пишутся как «подача»."); }
      else if (command.action === "on_order") { beginOnOrder(); setOrderMarkSaved("Отмечен заказ — километры пишутся как «заказ»."); }
      else { endActivity(); setOrderMarkSaved("Высадка отмечена — заказ завершён."); }
      return;
    }
    const ids = await addIncomeBatch(command.amount, command.count);
    if (!ids.length) { setError("Не удалось записать заказ."); return; }
    setSavedEntryIds(ids);
  };
  const summary = command?.kind === "income" ? `${command.count} заказ · ${formatCurrencyDisplay(command.total, currency)}` : command?.kind === "fuel" ? `Заправка · ${formatCurrencyDisplay(command.amount, currency)}` : command?.kind === "order_activity" ? (command.action === "pickup" ? "Подача — еду за пассажиром" : command.action === "on_order" ? "Везу пассажира" : "Высадил — заказ завершён") : null;
  return <SafeAreaView className="flex-1 bg-slate-950 px-5 py-6">
    <View className="flex-row items-center justify-between"><Text className="text-xl font-semibold text-white">Голосовой ввод</Text><Pressable onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full bg-white/5"><MaterialIcons name="close" size={22} color="#cbd5e1" /></Pressable></View>
    <View className="flex-1 items-center justify-center">
      <Pressable onPress={() => listening ? ExpoSpeechRecognitionModule.stop() : void start()} className={`h-28 w-28 items-center justify-center rounded-full border ${listening ? "border-rose-300 bg-rose-500/20" : "border-cyan-300 bg-cyan-500/15"}`}><MaterialIcons name={listening ? "stop" : "mic"} size={46} color={listening ? "#fda4af" : "#67e8f9"} /></Pressable>
      <Text className="mt-5 text-sm text-slate-400">{listening ? "Говорите..." : "Нажмите и произнесите команду"}</Text>
      {transcript ? <Text className="mt-5 text-center text-lg text-white">«{transcript}»</Text> : null}
      {summary ? <Text className="mt-3 text-center text-base font-semibold text-emerald-300">{summary}</Text> : null}
      {currencyMismatch ? <Text className="mt-3 text-center text-sm text-rose-300">В команде {commandCurrency}, а валюта профиля {currency}. Измените команду или валюту профиля.</Text> : null}
      {transcript && !command ? <Text className="mt-3 text-center text-sm text-amber-300">Назовите заказ или заправку и сумму.</Text> : null}
      {lowConfidence ? <Text className="mt-3 text-center text-sm text-amber-300">Низкая уверенность распознавания. Повторите команду.</Text> : null}
      {orderMarkSaved ? <Text className="mt-3 text-center text-sm text-emerald-300">{orderMarkSaved}</Text> : null}
      {error ? <Text className="mt-3 text-center text-sm text-rose-300">{error}</Text> : null}
    </View>
    {savedEntryIds.length || orderMarkSaved ? <View className="gap-3"><PrimaryButton title="Готово" onPress={() => router.back()} />{savedEntryIds.length ? <Pressable onPress={() => void undoIncomeEntries(savedEntryIds).then(() => { setSavedEntryIds([]); setTranscript(""); setResultFinal(false); })} className="items-center py-3"><Text className="text-sm font-semibold text-rose-300">Отменить запись</Text></Pressable> : null}</View> : <PrimaryButton title="Подтвердить" onPress={() => void confirm()} disabled={!command || !resultFinal || listening || lowConfidence || currencyMismatch} />}
  </SafeAreaView>;
}
