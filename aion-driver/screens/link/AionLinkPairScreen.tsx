import { router } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CockpitBackground } from "../../components/ui/CockpitBackground";
import { GlowCard } from "../../components/ui/GlowCard";
import { GradientButton } from "../../components/ui/GradientButton";

export function AionLinkPairScreen() {
  return (
    <SafeAreaView className="flex-1 bg-slate-950" edges={["top", "left", "right"]}>
      <CockpitBackground>
        <ScrollView className="flex-1 px-4 pt-2">
        <Text className="text-center text-xs uppercase tracking-[0.35em] text-slate-500">
          Подключение
        </Text>
        <Text className="mt-4 text-center text-xl font-semibold text-white">
          Два телефона — один аккаунт
        </Text>
        <GlowCard glow="violet" className="mt-6 mb-4">
          <Text className="text-sm leading-6 text-slate-300">
            На личном телефоне откройте AION и раздел устройств. Сгенерируйте код или QR — затем
            отсканируйте или введите код здесь. Так мы поймём, что оба телефона принадлежат вам, без
            лишних прав.
          </Text>
          <Text className="mt-4 text-xs text-slate-500">
            Экран сканирования и облачная проверка появятся в следующем обновлении — пока хранится
            только безопасная заготовка.
          </Text>
        </GlowCard>
        <View className="mb-8">
          <GradientButton title="Назад" variant="glass" onPress={() => router.back()} />
        </View>
      </ScrollView>
      </CockpitBackground>
    </SafeAreaView>
  );
}
