import { useCallback, useEffect, useRef, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { parsePairCodeFromQr } from "../../features/aion-link/parsePairCodeFromQr";
import { GradientButton } from "../ui/GradientButton";

type Props = {
  visible: boolean;
  onClose: () => void;
  onCode: (code: string) => void;
};

export function LinkPairQrScannerModal({ visible, onClose, onCode }: Props) {
  const insets = useSafeAreaInsets();
  const [perm, request] = useCameraPermissions();
  const handled = useRef(false);
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      handled.current = false;
      setHint(null);
    }
  }, [visible]);

  const onScan = useCallback(
    ({ data }: { data: string }) => {
      if (handled.current) return;
      const code = parsePairCodeFromQr(data);
      if (!code) {
        setHint("Не распознан код AION Link");
        return;
      }
      handled.current = true;
      onCode(code);
      onClose();
    },
    [onClose, onCode],
  );

  if (!visible) return null;

  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen">
      <View className="flex-1 bg-black" style={{ paddingTop: insets.top }}>
        <View className="flex-row items-center justify-between px-4 py-3">
          <Pressable onPress={onClose} className="rounded-xl bg-white/10 px-4 py-2">
            <Text className="text-sm font-semibold text-white">Закрыть</Text>
          </Pressable>
          <Text className="text-xs uppercase tracking-widest text-violet-300/90">QR · AION Link</Text>
          <View style={{ width: 72 }} />
        </View>
        {perm?.granted === false && !perm?.canAskAgain ? (
          <View className="flex-1 items-center justify-center px-6">
            <Text className="text-center text-base text-slate-300">
              Нужен доступ к камере для сканирования QR с другого телефона.
            </Text>
            <View className="mt-4 w-full">
              <GradientButton title="Разрешить камеру" onPress={() => void request()} />
            </View>
          </View>
        ) : perm?.granted ? (
          <CameraView
            style={{ flex: 1 }}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={onScan}
          />
        ) : (
          <View className="flex-1 items-center justify-center px-6">
            <GradientButton title="Разрешить камеру" onPress={() => void request()} />
          </View>
        )}
        <View
          className="border-t border-white/10 bg-slate-950/95 px-5 py-4"
          style={{ paddingBottom: insets.bottom + 12 }}
        >
          <Text className="text-center text-xs text-slate-400">
            Наведите на QR с экрана «Выпустить код» на втором телефоне
          </Text>
          {hint ? <Text className="mt-2 text-center text-xs text-rose-300">{hint}</Text> : null}
        </View>
      </View>
    </Modal>
  );
}
