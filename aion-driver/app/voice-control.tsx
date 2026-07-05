import { router } from "expo-router";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PrimaryButton } from "../components/PrimaryButton";

/**
 * HOTFIX (runtime 1.0.9): модуль распознавания речи добавлен в код ПОСЛЕ сборки
 * установленного APK 14 — его нативной части в приложении нет, и импорт
 * expo-speech-recognition роняет процесс при открытии экрана. До установки
 * нового APK показываем честную заглушку. Полный голосовой ввод вернётся
 * в APK 1.1.0.
 */
export default function VoiceControlScreen() {
  return (
    <SafeAreaView className="flex-1 bg-slate-950 px-5 py-6">
      <Text className="text-xl font-semibold text-white">Голосовой ввод</Text>
      <View className="flex-1 items-center justify-center px-4">
        <Text className="text-center text-base text-slate-300">
          Голосовой ввод заработает после обновления приложения (новая версия, не «тихое» обновление).
        </Text>
        <Text className="mt-3 text-center text-sm text-slate-500">
          Пока можно добавлять заказы и заправки кнопками «Доход +» и «Заправка» — всё считается как обычно.
        </Text>
      </View>
      <PrimaryButton title="Назад" onPress={() => router.back()} />
    </SafeAreaView>
  );
}
