import { Platform, type ViewStyle } from "react-native";
import { colors } from "./colors";

/** Карточки / панели */
export const shadows = {
  card: {
    shadowColor: "#000000",
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: Platform.OS === "android" ? 8 : 0,
  } satisfies ViewStyle,
  tabBar: {
    shadowColor: colors.cyan400,
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: Platform.OS === "android" ? 12 : 0,
  } satisfies ViewStyle,
  glowCyan: {
    shadowColor: colors.cyan400,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  } satisfies ViewStyle,
} as const;
