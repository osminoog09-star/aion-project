import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const PREFIX = "aion-secure-json-";

/** Небольшие чувствительные JSON-настройки (не заменяет Supabase auth storage). */
export async function setSecureJson(key: string, value: unknown): Promise<void> {
  if (Platform.OS === "web") return;
  await SecureStore.setItemAsync(PREFIX + key, JSON.stringify(value));
}

export async function getSecureJson<T>(key: string): Promise<T | null> {
  if (Platform.OS === "web") return null;
  try {
    const raw = await SecureStore.getItemAsync(PREFIX + key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function deleteSecureJson(key: string): Promise<void> {
  if (Platform.OS === "web") return;
  await SecureStore.deleteItemAsync(PREFIX + key);
}
