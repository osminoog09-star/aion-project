import { useDevice } from "./useDevice";

export function useResolvedDistanceUnits() {
  const { settings } = useDevice();
  return settings.distanceUnits;
}
