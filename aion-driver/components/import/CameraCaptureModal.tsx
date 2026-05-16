import { useRef, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GradientButton } from "../ui/GradientButton";

type Props = {
  visible: boolean;
  onClose: () => void;
  onCaptured: (uri: string) => void;
};

export function CameraCaptureModal({ visible, onClose, onCaptured }: Props) {
  const ref = useRef<CameraView>(null);
  const insets = useSafeAreaInsets();
  const [perm, request] = useCameraPermissions();
  const [busy, setBusy] = useState(false);

  const ensurePerm = async () => {
    if (perm?.granted) return true;
    const r = await request();
    return r.granted;
  };

  const snap = async () => {
    if (!(await ensurePerm())) return;
    setBusy(true);
    try {
      const photo = await ref.current?.takePictureAsync({ quality: 0.85 });
      if (photo?.uri) {
        onCaptured(photo.uri);
        onClose();
      }
    } finally {
      setBusy(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen">
      <View className="flex-1 bg-black" style={{ paddingTop: insets.top }}>
        <View className="flex-row items-center justify-between px-4 py-3">
          <Pressable onPress={onClose} className="rounded-xl bg-white/10 px-4 py-2">
            <Text className="text-sm font-semibold text-white">Закрыть</Text>
          </Pressable>
          <Text className="text-xs uppercase tracking-widest text-cyan-300/90">
            Камера
          </Text>
          <View style={{ width: 72 }} />
        </View>
        {perm?.granted === false && !perm.canAskAgain ? (
          <View className="flex-1 items-center justify-center px-6">
            <Text className="text-center text-base text-slate-300">
              Нет доступа к камере. Разрешите в настройках ОС.
            </Text>
          </View>
        ) : (
          <CameraView ref={ref} style={{ flex: 1 }} facing="back" />
        )}
        <View
          className="border-t border-white/10 bg-slate-950/95 px-5 py-4"
          style={{ paddingBottom: insets.bottom + 12 }}
        >
          <GradientButton
            title={busy ? "Сохранение…" : "Снимок"}
            onPress={() => void snap()}
            loading={busy}
            disabled={busy}
            size="cockpit"
          />
        </View>
      </View>
    </Modal>
  );
}
