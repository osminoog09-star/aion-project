import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Modal, Platform, Pressable, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GradientButton } from "../ui/GradientButton";

export type AppConfirmModalProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  /** Если `null`, вторая кнопка скрыта. */
  cancelLabel?: string | null;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function AppConfirmModal({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = "Отмена",
  destructive,
  onConfirm,
  onCancel,
}: AppConfirmModalProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const cardW = Math.min(360, width - 40);

  if (!visible) return null;

  const inner = (
    <View className="border border-white/10 p-6" style={{ paddingBottom: Math.max(insets.bottom, 20) }}>
      <Text className="text-center text-xl font-semibold tracking-tight text-white">{title}</Text>
      <Text className="mt-3 text-center text-sm leading-5 text-slate-400">{message}</Text>
      <View className="mt-8 gap-3">
        <GradientButton
          title={confirmLabel}
          variant={destructive ? "danger" : "glass"}
          onPress={onConfirm}
          size="cockpit"
        />
        {cancelLabel != null ? (
          <GradientButton title={cancelLabel} variant="ghost" onPress={onCancel} size="cockpit" />
        ) : null}
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
      <View className="flex-1 items-center justify-center bg-black/70 px-5">
        <Pressable accessibilityLabel="Закрыть" onPress={onCancel} className="absolute inset-0" />
        <View style={{ width: cardW }} className="overflow-hidden rounded-[26px]">
          <LinearGradient
            colors={["rgba(15,23,42,0.96)", "rgba(3,7,18,0.92)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 26 }}
          >
            {Platform.OS === "ios" ? (
              <BlurView intensity={40} tint="dark" style={{ borderRadius: 26 }}>
                {inner}
              </BlurView>
            ) : (
              <View className="bg-slate-950/95">{inner}</View>
            )}
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}
