import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const CHUNK_SIZE = 1800;
const CHUNKS_SUFFIX = "_chunk_count";

/**
 * Хранилище сессии Supabase: SecureStore с разбиением на чанки (лимит ~2KB на ключ).
 * На web — AsyncStorage (ограничения платформы).
 */
function createChunkedSecureStore() {
  const prefix = "aion-sb-auth-";

  async function removeChunks(key: string): Promise<void> {
    const k = prefix + key;
    if (Platform.OS === "web") {
      await AsyncStorage.removeItem(k);
      return;
    }
    try {
      const countStr = await SecureStore.getItemAsync(k + CHUNKS_SUFFIX);
      if (countStr != null) {
        const n = parseInt(countStr, 10);
        if (Number.isFinite(n)) {
          for (let i = 0; i < n; i++) {
            await SecureStore.deleteItemAsync(`${k}_part_${i}`);
          }
        }
        await SecureStore.deleteItemAsync(k + CHUNKS_SUFFIX);
      }
      await SecureStore.deleteItemAsync(k);
    } catch {
      /* noop */
    }
  }

  return {
    async getItem(key: string): Promise<string | null> {
      const k = prefix + key;
      if (Platform.OS === "web") {
        return AsyncStorage.getItem(k);
      }
      try {
        const countStr = await SecureStore.getItemAsync(k + CHUNKS_SUFFIX);
        if (countStr == null) {
          return SecureStore.getItemAsync(k);
        }
        const n = parseInt(countStr, 10);
        if (!Number.isFinite(n) || n <= 0) return null;
        let out = "";
        for (let i = 0; i < n; i++) {
          const part = await SecureStore.getItemAsync(`${k}_part_${i}`);
          out += part ?? "";
        }
        return out || null;
      } catch {
        return null;
      }
    },

    async setItem(key: string, value: string): Promise<void> {
      const k = prefix + key;
      if (Platform.OS === "web") {
        await AsyncStorage.setItem(k, value);
        return;
      }
      await removeChunks(key);
      if (value.length <= CHUNK_SIZE) {
        await SecureStore.setItemAsync(k, value);
        return;
      }
      const chunks: string[] = [];
      for (let i = 0; i < value.length; i += CHUNK_SIZE) {
        chunks.push(value.slice(i, i + CHUNK_SIZE));
      }
      await SecureStore.setItemAsync(k + CHUNKS_SUFFIX, String(chunks.length));
      for (let i = 0; i < chunks.length; i++) {
        await SecureStore.setItemAsync(`${k}_part_${i}`, chunks[i]!);
      }
    },

    async removeItem(key: string): Promise<void> {
      await removeChunks(key);
    },
  };
}

export const supabaseAuthStorage = createChunkedSecureStore();
