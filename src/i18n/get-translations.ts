import { defaultLocale, type Locale } from "./config";
import { en } from "./locales/en";
import { ru, type Messages } from "./locales/ru";

const dictionaries: Record<Locale, Messages> = { ru: ru as Messages, en: en as Messages };

export function getDictionary(locale: Locale = defaultLocale): Messages {
  return dictionaries[locale] ?? ru;
}

export type Translator = (
  path: string,
  vars?: Record<string, string | number>,
) => string;

export function createTranslator(dict: Messages): Translator {
  return function t(path: string, vars?: Record<string, string | number>): string {
    const keys = path.split(".");
    let cur: unknown = dict;
    for (const k of keys) {
      if (cur == null || typeof cur !== "object") {
        cur = undefined;
        break;
      }
      cur = (cur as Record<string, unknown>)[k];
    }
    if (typeof cur !== "string") return path;
    if (!vars) return cur;
    return cur.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? `{${key}}`));
  };
}

export function getTranslations(locale: Locale = defaultLocale): Translator {
  return createTranslator(getDictionary(locale));
}

/** Синхронный переводчик по умолчанию (ru) — для RSC и клиентских компонентов. */
export const t = createTranslator(ru as Messages);
