/** Устройство, с которого пришёл снимок (личный / рабочий) — задел под relay и аналитику */
export type AionLinkRemoteSlot = {
  id: string;
  label: string;
  createdAt: number;
};

export type AionLinkLocalPersisted = {
  /** Стабильный id этой установки (источник в payload очереди) */
  thisDeviceId: string;
  /** Имя на экранах и в списке устройств */
  thisDeviceLabel: string;
  /** Парные слоты — заполнятся после облачного pairing */
  remoteSlots: AionLinkRemoteSlot[];
};

export type LinkOcrSnapshotPayload = {
  sourceDeviceId: string;
  createdAt: number;
  note?: string;
};
