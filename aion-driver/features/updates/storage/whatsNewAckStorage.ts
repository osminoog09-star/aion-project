import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../../../storage/core/keys";

const KEY = STORAGE_KEYS.WHATS_NEW_SEEN_OTA_UPDATE_ID;

/** Какой OTA updateId пользователь уже «прочитал» в What’s New. */
export async function getWhatsNewSeenOtaUpdateId(): Promise<string | null> {
  const v = await AsyncStorage.getItem(KEY);
  return v?.trim() || null;
}

export async function setWhatsNewSeenOtaUpdateId(id: string | null): Promise<void> {
  if (!id) {
    await AsyncStorage.removeItem(KEY);
    return;
  }
  await AsyncStorage.setItem(KEY, id);
}
