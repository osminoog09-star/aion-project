import { Modal, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GradientButton } from "../ui/GradientButton";

type Props = {
  visible: boolean;
  onClose: () => void;
  onCaptured: (uri: string) => void;
};

/**
 * Веб: нативная камера недоступна — подсказка использовать галерею/файл.
 */
export function CameraCaptureModal({ visible, onClose, onCaptured: _onCaptured }: Props) {
  const insets = useSafeAreaInsets();
  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.75)",
          justifyContent: "flex-end",
          paddingBottom: insets.bottom + 16,
          paddingHorizontal: 20,
        }}
      >
        <View
          style={{
            borderRadius: 20,
            backgroundColor: "#0f172a",
            borderWidth: 1,
            borderColor: "rgba(148,163,184,0.35)",
            padding: 20,
          }}
        >
          <Text style={{ color: "#e2e8f0", fontSize: 17, fontWeight: "800" }}>Камера в браузере</Text>
          <Text style={{ color: "#94a3b8", fontSize: 14, marginTop: 10, lineHeight: 20 }}>
            Снимок с камеры здесь недоступен. Используйте «Галерея» или «Файл» на экране импорта.
          </Text>
          <GradientButton title="Понятно" variant="glass" style={{ marginTop: 20 }} onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}
