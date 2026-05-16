import AsyncStorage from "@react-native-async-storage/async-storage";
import type { UserProfile } from "../../types";
import { normalizeUserProfile } from "../../utils/migrations";
import { STORAGE_KEYS } from "../core/keys";

export async function loadProfile(): Promise<UserProfile | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.PROFILE);
  if (!raw) return null;
  try {
    return normalizeUserProfile(JSON.parse(raw));
  } catch {
    return null;
  }
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
}

export async function clearProfile(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.PROFILE);
}
