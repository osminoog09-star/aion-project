import type { Href } from "expo-router";
import type { AionRecommendation } from "./memoryTypes";

type RouterPush = (href: Href) => void;

/**
 * Single entry for recommendation → route (hub, desktop, HUD).
 */
export function navigateFromAionRecommendation(push: RouterPush, r: AionRecommendation): void {
  switch (r.action) {
    case "open_driver":
      push("/driver");
      return;
    case "open_ota_debug":
      push("/ota-debug");
      return;
    case "open_diagnostics":
      push("/aion-diagnostics");
      return;
    case "open_settings":
    default:
      push("/settings");
  }
}
