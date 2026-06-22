import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from "expo-speech-recognition";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PrimaryButton } from "../components/PrimaryButton";
import { parseDriverVoiceCommand } from "../features/voice/parseDriverVoiceCommand";
import { useShift } from "../hooks/useShift";
import { useResolvedCurrency } from "../hooks/useResolvedCurrency";
import { formatCurrencyDisplay } from "../utils/formatting";

export default function VoiceControlScreen() {
  const { activeShift, addIncome } = useShift();
  const currency = useResolvedCurrency();
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const command = parseDriverVoiceCommand(transcript);
  useSpeechRecognitionEvent("start", () => setListening(true));
  useSpeechRecognitionEvent("end", () => setListening(false));
  useSpeechRecognitionEvent("result", (event) => setTranscript(event.results[0]?.transcript ?? ""));
  useSpeechRecognitionEvent("error", () => { setListening(false); setError("Не удалось распознать команду."); });

  const start = async () => {
    setError(null); setTranscript("");
    if (!ExpoSpeechRecognitionModule.isRecognitionAvailable()) { setError("Сервис распознавания речи недоступен."); return; }
    const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!permission.granted) { setError("Для голосового ввода нужен микрофон."); return; }
    ExpoSpeechRecognitionModule.start({ lang: "ru-RU", interimResults: true, continuous: false, maxAlternatives: 1, contextualStrings: ["добавь заказ", "заправился", "евро", "рублей"] });
  };
  const confirm = async () => {
    if (!command) return;
    if (command.kind === "fuel") { router.replace({ pathname: "/add-fuel", params: { total: String(command.amount) } }); return; }
    if (!activeShift) { Alert.alert("Нет активной смены", "Сначала начните смену."); return; }
    for (let i = 0; i < command.count; i += 1) await addIncome(command.amount);
    router.back();
  };
  const summary = command?.kind === "income" ? `${command.count} заказ · ${formatCurrencyDisplay(command.total, currency)}` : command?.kind === "fuel" ? `Заправка · ${formatCurrencyDisplay(command.amount, currency)}` : null;
  return <SafeAreaView className="flex-1 bg-slate-950 px-5 py-6">
    <View className="flex-row items-center justify-between"><Text className="text-xl font-semibold text-white">Голосовой ввод</Text><Pressable onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full bg-white/5"><MaterialIcons name="close" size={22} color="#cbd5e1" /></Pressable></View>
    <View className="flex-1 items-center justify-center">
      <Pressable onPress={() => listening ? ExpoSpeechRecognitionModule.stop() : void start()} className={`h-28 w-28 items-center justify-center rounded-full border ${listening ? "border-rose-300 bg-rose-500/20" : "border-cyan-300 bg-cyan-500/15"}`}><MaterialIcons name={listening ? "stop" : "mic"} size={46} color={listening ? "#fda4af" : "#67e8f9"} /></Pressable>
      <Text className="mt-5 text-sm text-slate-400">{listening ? "Говорите..." : "Нажмите и произнесите команду"}</Text>
      {transcript ? <Text className="mt-5 text-center text-lg text-white">«{transcript}»</Text> : null}
      {summary ? <Text className="mt-3 text-center text-base font-semibold text-emerald-300">{summary}</Text> : null}
      {transcript && !command ? <Text className="mt-3 text-center text-sm text-amber-300">Назовите заказ или заправку и сумму.</Text> : null}
      {error ? <Text className="mt-3 text-center text-sm text-rose-300">{error}</Text> : null}
    </View>
    <PrimaryButton title="Подтвердить" onPress={() => void confirm()} disabled={!command || listening} />
  </SafeAreaView>;
}
