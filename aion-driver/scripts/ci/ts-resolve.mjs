/**
 * Node ESM resolve-хук для CI-тестов: разрешает extensionless относительные
 * импорты к .ts/.tsx, как это делает Metro/TS. Node 24 type-stripping сам
 * НЕ дорезолвивает `./foo` → `./foo.ts`, поэтому модуль с value-импортом
 * соседа (напр. buildMapsFuelIntelligence.ts → ./classifyKilometers) при
 * прямом запуске под node падает с ERR_MODULE_NOT_FOUND, а тест молча
 * скипается. Хук применяется ТОЛЬКО к тестовому процессу (через --import),
 * исходники остаются идиоматичными (без расширений) для бандлера.
 *
 * Импорты с явным расширением и bare-спецификаторы проходят без изменений.
 */
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const CANDIDATES = [".ts", ".tsx", "/index.ts", "/index.tsx"];

export async function resolve(specifier, context, next) {
  const isRelative = specifier.startsWith("./") || specifier.startsWith("../");
  const hasExtension = /\.[mc]?[jt]sx?$/.test(specifier);
  if (isRelative && !hasExtension && context.parentURL) {
    for (const ext of CANDIDATES) {
      const candidate = new URL(specifier + ext, context.parentURL);
      if (existsSync(fileURLToPath(candidate))) {
        return next(specifier + ext, context);
      }
    }
  }
  return next(specifier, context);
}
