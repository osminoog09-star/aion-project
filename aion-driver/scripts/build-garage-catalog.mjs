/**
 * Генерирует data/vehicles/garage-expanded.json (500+ записей каталога).
 * Запуск: node scripts/build-garage-catalog.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outPath = path.join(root, "data", "vehicles", "garage-expanded.json");

const brands = [
  ["Volkswagen", ["Golf", "Passat", "Tiguan", "T-Roc", "Polo", "Arteon", "Touran", "Caddy"]],
  ["Škoda", ["Octavia", "Superb", "Kodiaq", "Karoq", "Fabia", "Scala", "Enyaq"]],
  ["Toyota", ["Corolla", "Camry", "RAV4", "C-HR", "Yaris", "Prius", "Highlander", "Proace"]],
  ["Honda", ["Civic", "Accord", "CR-V", "HR-V", "Jazz", "e:NS1"]],
  ["Hyundai", ["i30", "Tucson", "Santa Fe", "Kona", "Ioniq 5", "Ioniq 6", "Staria"]],
  ["Kia", ["Ceed", "Sportage", "Sorento", "Niro", "EV6", "Picanto", "Stonic"]],
  ["Ford", ["Focus", "Mondeo", "Kuga", "Puma", "Transit", "Tourneo"]],
  ["Opel", ["Astra", "Corsa", "Insignia", "Mokka", "Crossland", "Combo"]],
  ["Peugeot", ["208", "308", "3008", "5008", "Partner", "Expert"]],
  ["Renault", ["Clio", "Megane", "Captur", "Kadjar", "Scenic", "Kangoo", "Zoe"]],
  ["Citroën", ["C3", "C4", "C5 Aircross", "Berlingo", "Jumpy"]],
  ["BMW", ["1 Series", "2 Series", "3 Series", "5 Series", "X1", "X3", "X5", "i4", "iX3"]],
  ["Mercedes-Benz", ["A-Class", "C-Class", "E-Class", "GLA", "GLC", "Sprinter", "EQB", "EQE"]],
  ["Audi", ["A3", "A4", "A6", "Q2", "Q3", "Q5", "e-tron"]],
  ["Volvo", ["V40", "V60", "XC40", "XC60", "XC90", "EX30"]],
  ["Nissan", ["Micra", "Juke", "Qashqai", "X-Trail", "Leaf", "NV200"]],
  ["Mazda", ["2", "3", "6", "CX-3", "CX-5", "CX-30", "MX-30"]],
  ["Suzuki", ["Swift", "Vitara", "S-Cross", "Across"]],
  ["Dacia", ["Sandero", "Duster", "Jogger", "Spring"]],
  ["Seat", ["Ibiza", "Leon", "Ateca", "Tarraco"]],
  ["Fiat", ["500", "Tipo", "Doblo", "Ducato", "500e"]],
  ["Jeep", ["Renegade", "Compass", "Cherokee", "Wrangler"]],
  ["Tesla", ["Model 3", "Model Y", "Model S", "Model X"]],
  ["MG", ["ZS", "HS", "5", "Marvel R"]],
  ["BYD", ["Atto 3", "Seal", "Dolphin", "Tang"]],
  ["Lada", ["Vesta", "Granta", "XRAY", "Niva", "Largus"]],
  ["GAZ", ["Sobol", "Gazelle Next", "Valdai"]],
  ["MAN", ["TGE", "TGL", "TGM"]],
  ["Iveco", ["Daily"]],
];

const transmissions = ["manual", "automatic", "cvt", "dct"];

function slug(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function pickFuel(year, idx) {
  if (year >= 2021 && idx % 11 === 0) {
    return { primary: "ev", secondary: undefined, engine: "Electric", mixed: 15.8 };
  }
  if (idx % 9 === 0) {
    return {
      primary: "petrol",
      secondary: "ev",
      engine: "Hybrid",
      mixed: 4.8 + (idx % 7) * 0.1,
    };
  }
  if (idx % 5 === 0) {
    return { primary: "diesel", secondary: undefined, engine: "2.0 TDI", mixed: 5.1 + (idx % 5) * 0.08 };
  }
  if (idx % 7 === 0) {
    return { primary: "lpg", secondary: undefined, engine: "1.6 LPG", mixed: 8.2 + (idx % 4) * 0.15 };
  }
  return {
    primary: "petrol",
    secondary: undefined,
    engine: `${(1.2 + (idx % 9) * 0.1).toFixed(1)} TSI`,
    mixed: 6.2 + (idx % 8) * 0.12,
  };
}

const rows = [];
let idx = 0;
for (const [brand, models] of brands) {
  for (const model of models) {
    for (const year of [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024]) {
      const f = pickFuel(year, idx);
      const urban = Math.round((f.mixed * 1.22 + Number.EPSILON) * 10) / 10;
      const extra = Math.round((f.mixed * 0.88 + Number.EPSILON) * 10) / 10;
      const id = `gen-${slug(brand)}-${slug(model)}-${year}-${idx}`;
      const entry = {
        id,
        brand,
        model,
        generation: year >= 2022 ? "IV" : year >= 2019 ? "III" : "II",
        year,
        engine: f.engine,
        transmission: f.primary === "ev" ? "automatic" : transmissions[idx % transmissions.length],
        fuelPrimary: f.primary,
        fuelSecondary: f.secondary,
        consumptionMixedLPer100Km: Math.round(f.mixed * 10) / 10,
        consumptionUrbanLPer100Km: urban,
        consumptionExtraUrbanLPer100Km: extra,
        tankLiters: f.primary === "ev" ? undefined : 42 + (idx % 28),
        batteryKWh:
          f.primary === "ev"
            ? 52 + (idx % 30)
            : f.secondary === "ev"
              ? 12 + (idx % 8)
              : undefined,
      };
      rows.push(entry);
      idx += 1;
      if (rows.length >= 540) break;
    }
    if (rows.length >= 540) break;
  }
  if (rows.length >= 540) break;
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(rows, null, 0), "utf8");
console.log("Wrote", rows.length, "vehicles to", outPath);
