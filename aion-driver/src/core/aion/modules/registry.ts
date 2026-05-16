/**
 * Реестр модулей AION Core — единая точка метаданных для Home, HUD и будущего marketplace модулей.
 */
export type ModuleReadiness = "live" | "beta" | "alpha" | "experimental" | "coming_soon";

export type AionModuleCategory =
  | "mobility"
  | "intelligence"
  | "finance"
  | "fleet"
  | "family"
  | "platform"
  | "commerce"
  | "crm";

export type ModuleHealth = "ok" | "degraded" | "unknown";

export type AionModuleId =
  | "driver"
  | "finance"
  | "fleet"
  | "family"
  | "crm"
  | "ai"
  | "home"
  | "cloud"
  | "garage"
  | "maps"
  | "market";

export type AionModuleDefinition = {
  id: AionModuleId;
  title: string;
  subtitle: string;
  icon: string;
  href?: string;
  readiness: ModuleReadiness;
  category: AionModuleCategory;
  health: ModuleHealth;
  /** Модули, от которых зависит UX/данные (декларативно). */
  dependsOn: AionModuleId[];
  accent: "cyan" | "violet" | "emerald" | "amber" | "rose" | "sky";
};

export const AION_MODULES: readonly AionModuleDefinition[] = [
  {
    id: "driver",
    title: "Driver",
    subtitle: "Смены, OCR, доход, карта, локальные AI-инсайты",
    icon: "local-taxi",
    href: "/driver",
    readiness: "live",
    category: "mobility",
    health: "ok",
    dependsOn: ["cloud"],
    accent: "cyan",
  },
  {
    id: "ai",
    title: "AION AI",
    subtitle: "Ассистент экосистемы, сценарии, память",
    icon: "auto-awesome",
    readiness: "beta",
    category: "intelligence",
    health: "unknown",
    dependsOn: ["cloud", "driver"],
    accent: "violet",
  },
  {
    id: "home",
    title: "Home OS",
    subtitle: "Хаб, автоматизации дома (план)",
    icon: "home",
    readiness: "coming_soon",
    category: "platform",
    health: "unknown",
    dependsOn: ["cloud"],
    accent: "sky",
  },
  {
    id: "cloud",
    title: "AION Cloud",
    subtitle: "Синхронизация, идентичность, edge-ready API",
    icon: "cloud",
    href: "/settings",
    readiness: "beta",
    category: "platform",
    health: "degraded",
    dependsOn: [],
    accent: "cyan",
  },
  {
    id: "finance",
    title: "Finance",
    subtitle: "Деньги, налоги, отчёты",
    icon: "account-balance-wallet",
    readiness: "coming_soon",
    category: "finance",
    health: "unknown",
    dependsOn: ["driver", "cloud"],
    accent: "emerald",
  },
  {
    id: "family",
    title: "Family",
    subtitle: "Семейный режим и цели",
    icon: "family-restroom",
    readiness: "coming_soon",
    category: "family",
    health: "unknown",
    dependsOn: ["cloud"],
    accent: "rose",
  },
  {
    id: "fleet",
    title: "Fleet",
    subtitle: "Автопарк и операции",
    icon: "groups",
    readiness: "coming_soon",
    category: "fleet",
    health: "unknown",
    dependsOn: ["driver", "cloud"],
    accent: "amber",
  },
  {
    id: "crm",
    title: "CRM",
    subtitle: "Клиенты, лиды, коммуникации",
    icon: "hub",
    readiness: "experimental",
    category: "crm",
    health: "unknown",
    dependsOn: ["cloud"],
    accent: "violet",
  },
  {
    id: "garage",
    title: "Garage",
    subtitle: "Транспорт, ТО, расходы по авто",
    icon: "home-repair-service",
    readiness: "coming_soon",
    category: "mobility",
    health: "unknown",
    dependsOn: ["driver"],
    accent: "sky",
  },
  {
    id: "maps",
    title: "Maps",
    subtitle: "Гео-слой платформы",
    icon: "map",
    readiness: "alpha",
    category: "mobility",
    health: "unknown",
    dependsOn: ["cloud"],
    accent: "cyan",
  },
  {
    id: "market",
    title: "Marketplace",
    subtitle: "Сервисы и интеграции",
    icon: "storefront",
    readiness: "coming_soon",
    category: "commerce",
    health: "unknown",
    dependsOn: ["cloud"],
    accent: "violet",
  },
];

export function readinessLabel(r: ModuleReadiness): string {
  switch (r) {
    case "live":
      return "LIVE";
    case "beta":
      return "BETA";
    case "alpha":
      return "ALPHA";
    case "experimental":
      return "LAB";
    case "coming_soon":
      return "SOON";
    default:
      return "—";
  }
}
