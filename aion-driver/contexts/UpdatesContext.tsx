import { createContext, useContext, type ReactNode } from "react";
import {
  useUpdatesController,
  type UseUpdatesResult,
  type UpdateUiPhase,
} from "../hooks/useUpdatesController";

const UpdatesContext = createContext<UseUpdatesResult | null>(null);

export type { UpdateUiPhase, UseUpdatesResult };

export function UpdatesProvider({ children }: { children: ReactNode }) {
  const value = useUpdatesController();
  return <UpdatesContext.Provider value={value}>{children}</UpdatesContext.Provider>;
}

export function useUpdates(): UseUpdatesResult {
  const ctx = useContext(UpdatesContext);
  if (!ctx) {
    throw new Error("useUpdates must be used within UpdatesProvider");
  }
  return ctx;
}
