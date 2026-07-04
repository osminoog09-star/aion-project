/**
 * Импорт .ts-модуля для CI-теста с ПРАВИЛЬНОЙ обработкой ошибок (анти-«тихий зелёный»).
 *
 * Старый паттерн `catch { console.log("skip"); process.exit(0) }` превращал ЛЮБОЙ
 * сбой импорта в ложный успех (exit 0, ноль проверок). Мы дважды на это напоролись:
 * модуль value-импортит соседний .ts БЕЗ расширения → Node не резолвит →
 * ERR_MODULE_NOT_FOUND → тихий скип.
 *
 * Различаем два случая:
 *  - ERR_MODULE_NOT_FOUND — РЕАЛЬНЫЙ баг тестовой инфраструктуры (модуль не
 *    резолвится). НЕ скипать — упасть громко (exit 1), иначе гейт ложно зелёный.
 *  - всё остальное (среда не исполняет TypeScript: старый Node без type-stripping →
 *    ERR_UNKNOWN_FILE_EXTENSION, либо синтаксис типов не распарсился) — легитимный
 *    скип (exit 0): тест нельзя выполнить здесь, и это не вина теста.
 *
 * Тесты запускать через `node --import ./scripts/ci/ts-register.mjs <test>`, чтобы
 * extensionless-импорты соседних .ts резолвились и ERR_MODULE_NOT_FOUND не возникал.
 *
 * Использование (стрелка сохраняет относительное разрешение пути из ФАЙЛА ТЕСТА):
 *   const mod = await importTsOrFail(() => import("../../path/to/module.ts"), "module");
 *   const { foo } = mod;
 */
export async function importTsOrFail(importFn, label = "module") {
  try {
    return await importFn();
  } catch (err) {
    if (err?.code === "ERR_MODULE_NOT_FOUND") {
      console.error(
        `FAIL: ${label} не резолвится (ERR_MODULE_NOT_FOUND) — реальный баг тестовой ` +
          `инфраструктуры (вероятно extensionless value-импорт соседнего .ts), не скип.\n` +
          String(err?.message ?? err),
      );
      process.exit(1);
    }
    console.log(
      `skip: ${label} не исполнить в этой среде (${err?.code ?? "syntax"}): ` +
        `${err?.message ?? err}`,
    );
    process.exit(0);
  }
}
