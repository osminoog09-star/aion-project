import { router } from "expo-router";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GradientButton } from "../components/ui/GradientButton";

/**
 * HOTFIX (runtime 1.0.9): в установленном APK нет ключа Google Maps, и рендер
 * карты мгновенно роняет приложение на Android. До установки нового APK
 * показываем честную заглушку вместо краша. Полноценная карта вернётся
 * в APK 1.1.0.
 */
export default function MapRoute() {
  return (
    <SafeAreaView className="flex-1 bg-slate-950 px-5 py-6">
      <Text className="text-xl font-semibold text-white">Карта</Text>
      <View className="flex-1 items-center justify-center px-4">
        <Text className="text-center text-base text-slate-300">
          Карта заработает после обновления приложения (новая версия, не «тихое» обновление).
        </Text>
        <Text className="mt-3 text-center text-sm text-slate-500">
          Когда новая версия будет готова, Центр обновлений предложит её установить. Маршруты смен при этом уже
          записываются — ничего не теряется.
        </Text>
      </View>
      <GradientButton title="Назад" variant="glass" onPress={() => router.back()} />
    </SafeAreaView>
  );
}
