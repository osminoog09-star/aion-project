export type DesktopNavItem = {
  href: "/desktop" | "/desktop/control-center" | "/desktop/cloud" | "/desktop/finance" | "/desktop/garage" | "/desktop/maps" | "/desktop/ai-room";
  label: string;
  shortcut?: string;
};

export const DESKTOP_NAV_ITEMS: readonly DesktopNavItem[] = [
  { href: "/desktop", label: "Обзор", shortcut: "1" },
  { href: "/desktop/control-center", label: "Центр управления", shortcut: "2" },
  { href: "/desktop/cloud", label: "Облако и синхронизация", shortcut: "3" },
  { href: "/desktop/finance", label: "Финансы", shortcut: "4" },
  { href: "/desktop/garage", label: "Гараж", shortcut: "5" },
  // «Карты и зоны» скрыт из навигации — экран-заглушка без данных (тупик).
  { href: "/desktop/ai-room", label: "ИИ-центр", shortcut: "6" },
] as const;
