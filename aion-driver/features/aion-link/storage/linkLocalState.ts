import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../../../storage/core/keys";
import type { AionLinkLocalPersisted, AionLinkRemoteSlot } from "../types";

const DEFAULT_LABEL = "Рабочий телефон";

function newDeviceId(): string {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function sanitizeSlots(raw: unknown): AionLinkRemoteSlot[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((x) => {
      if (!x || typeof x !== "object") return null;
      const o = x as Record<string, unknown>;
      const id = typeof o.id === "string" ? o.id : "";
      const label = typeof o.label === "string" ? o.label : "";
      const createdAt =
        typeof o.createdAt === "number" && Number.isFinite(o.createdAt)
          ? o.createdAt
          : Date.now();
      if (!id || !label.trim()) return null;
      return { id, label: label.trim(), createdAt };
    })
    .filter((x): x is AionLinkRemoteSlot => x != null);
}

export async function loadAionLinkLocalState(): Promise<AionLinkLocalPersisted> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.AION_LINK_STATE);
  if (!raw) {
    const fresh: AionLinkLocalPersisted = {
      thisDeviceId: newDeviceId(),
      thisDeviceLabel: DEFAULT_LABEL,
      remoteSlots: [],
    };
    await AsyncStorage.setItem(STORAGE_KEYS.AION_LINK_STATE, JSON.stringify(fresh));
    return fresh;
  }
  try {
    const p = JSON.parse(raw) as Partial<AionLinkLocalPersisted>;
    let thisDeviceId =
      typeof p.thisDeviceId === "string" && p.thisDeviceId.trim()
        ? p.thisDeviceId.trim()
        : "";
    if (!thisDeviceId) thisDeviceId = newDeviceId();
    const thisDeviceLabel =
      typeof p.thisDeviceLabel === "string" && p.thisDeviceLabel.trim()
        ? p.thisDeviceLabel.trim()
        : DEFAULT_LABEL;
    const remoteSlots = sanitizeSlots(p.remoteSlots);
    const next: AionLinkLocalPersisted = {
      thisDeviceId,
      thisDeviceLabel,
      remoteSlots,
    };
    await AsyncStorage.setItem(STORAGE_KEYS.AION_LINK_STATE, JSON.stringify(next));
    return next;
  } catch {
    const fresh: AionLinkLocalPersisted = {
      thisDeviceId: newDeviceId(),
      thisDeviceLabel: DEFAULT_LABEL,
      remoteSlots: [],
    };
    await AsyncStorage.setItem(STORAGE_KEYS.AION_LINK_STATE, JSON.stringify(fresh));
    return fresh;
  }
}

export async function saveAionLinkLocalState(
  next: AionLinkLocalPersisted,
): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.AION_LINK_STATE, JSON.stringify(next));
}
