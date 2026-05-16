import type { VehicleCatalogEntry } from "../../core/types/vehicle";

/** Короткий визуальный маркер в списках (без внешних ассетов). */
export function vehicleCatalogGlyph(entry: Pick<VehicleCatalogEntry, "brand" | "model" | "fuelPrimary">): string {
  const b = `${entry.brand} ${entry.model}`.toLowerCase();
  if (entry.fuelPrimary === "ev") return "⚡";
  if (b.includes("tesla")) return "⚡";
  if (b.includes("bmw")) return "◆";
  if (b.includes("mercedes")) return "◇";
  if (b.includes("audi")) return "◎";
  if (b.includes("volkswagen") || b.includes("vw")) return "▣";
  if (b.includes("toyota")) return "◉";
  if (b.includes("hyundai") || b.includes("kia")) return "▲";
  if (b.includes("ford")) return "◈";
  if (b.includes("lada") || b.includes("ваз")) return "▸";
  if (b.includes("man") || b.includes("iveco") || b.includes("gaz")) return "⛟";
  return "🚘";
}
