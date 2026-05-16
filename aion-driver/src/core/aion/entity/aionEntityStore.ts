import { create } from "zustand";

type AionEntityStore = {
  panelOpen: boolean;
  ocrActive: boolean;
  /** Пока `Date.now() < successUntilMs` — состояние success в derive */
  successUntilMs: number;
  openPanel: () => void;
  closePanel: () => void;
  setOcrActive: (v: boolean) => void;
  /** Короткий импульс «успех» после OCR / синка */
  triggerSuccess: (durationMs?: number) => void;
};

export const useAionEntityStore = create<AionEntityStore>((set, get) => ({
  panelOpen: false,
  ocrActive: false,
  successUntilMs: 0,
  openPanel: () => set({ panelOpen: true }),
  closePanel: () => set({ panelOpen: false }),
  setOcrActive: (v) => set({ ocrActive: v }),
  triggerSuccess: (durationMs = 2400) => {
    const until = Date.now() + durationMs;
    set({ successUntilMs: until });
    setTimeout(() => {
      if (get().successUntilMs <= until) {
        set({ successUntilMs: 0 });
      }
    }, durationMs + 80);
  },
}));
