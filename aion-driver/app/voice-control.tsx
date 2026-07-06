import { requireOptionalNativeModule } from "expo-modules-core";
import { router } from "expo-router";
import type { ComponentType } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PrimaryButton } from "../components/PrimaryButton";

/**
 * Голосовой ввод требует нативного модуля распознавания речи. На старом APK
 * (рантайм до 1.1.0) его нет — статический импорт expo-speech-recognition
 * РОНЯЕТ процесс. Гейт: проверяем наличие модуля через requireOptionalNativeModule
 * (возвращает null, НЕ бросает), и require активной части выполняется ТОЛЬКО
 * когда модуль реально есть. Иначе — честная заглушка вместо краша.
 */
const speechAvailable = requireOptionalNativeModule("ExpoSpeechRecognition") != null;
const ActiveScreen: ComponentType | null = speechAvailable
  ? (require("../screens/VoiceControlActiveScreen").default as ComponentType)
  : null;

function VoiceUnavailable() {
  return (
    <SafeAreaView className="flex-1 bg-slate-950 px-5 py-6">
      <Text className="text-xl font-semibold text-white">Голосовой ввод</Text>
      <View className="flex-1 items-center justify-center px-4">
        <Text className="text-center text-base text-slate-300">
          Голосовой ввод заработает после обновления приложения (новая версия, не «тихое» обновление).
        </Text>
        <Text className="mt-3 text-center text-sm text-slate-500">
          Пока добавляйте заказы и заправки кнопками «Доход +» и «Заправка» — всё считается как обычно.
        </Text>
      </View>
      <PrimaryButton title="Назад" onPress={() => router.back()} />
    </SafeAreaView>
  );
}

export default function VoiceControlScreen() {
  return ActiveScreen ? <ActiveScreen /> : <VoiceUnavailable />;
}
