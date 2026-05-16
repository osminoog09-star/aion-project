import { useDevice } from "../contexts/DeviceContext";

export function useCompanionMode(): boolean {
  return useDevice().settings.companionMode;
}
