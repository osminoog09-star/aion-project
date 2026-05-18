import { router } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";
import { useAionEntityStore } from "../../src/core/aion/entity/aionEntityStore";

/**
 * Deep-link landing для floating overlay orb (long-press).
 * Открывает AionEntityPanel (mini-статус) и возвращает на главный hub.
 */
export default function OrbStatusBridge() {
  const openPanel = useAionEntityStore((s) => s.openPanel);

  useEffect(() => {
    openPanel();
    const t = setTimeout(() => {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/");
      }
    }, 50);
    return () => clearTimeout(t);
  }, [openPanel]);

  return <View style={{ flex: 1, backgroundColor: "transparent" }} />;
}
