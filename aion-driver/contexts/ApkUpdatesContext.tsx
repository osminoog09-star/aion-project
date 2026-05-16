import { createContext, useContext, type ReactNode } from "react";
import { useApkUpdateController } from "../src/core/updates/useApkUpdateController";

type ApkCtx = ReturnType<typeof useApkUpdateController>;

const ApkUpdatesContext = createContext<ApkCtx | null>(null);

export function ApkUpdatesProvider({ children }: { children: ReactNode }) {
  const value = useApkUpdateController();
  return <ApkUpdatesContext.Provider value={value}>{children}</ApkUpdatesContext.Provider>;
}

export function useApkUpdates(): ApkCtx {
  const v = useContext(ApkUpdatesContext);
  if (!v) throw new Error("useApkUpdates must be used within ApkUpdatesProvider");
  return v;
}
