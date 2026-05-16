/**
 * Заготовка под наблюдение за папкой скриншотов без агрессивного фона.
 * Реализация (MediaStore / редкий polling) — следующая фаза; сейчас no-op.
 */
/** Не заявлять «автоскриншоты» в маркетинге/roadmap пока false. */
export const AION_LINK_SCREENSHOT_AUTOMATION_READY = false as const;
export function startAionLinkScreenshotWatch(_handlers: {
  onCandidatePaths: (paths: string[]) => void;
}): () => void {
  return () => undefined;
}
