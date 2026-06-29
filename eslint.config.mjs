import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // aion-driver — отдельный Expo/React Native проект со своим typecheck и CI
    // (npm run validate:code). Его НЕ линтуем web-конфигом портала.
    "aion-driver/**",
    // Node-скрипты сборки/деплоя/CI — не браузерный код приложения.
    "scripts/**",
  ]),
  {
    // React Compiler ESLint-правила релевантны только при использовании React
    // Compiler; портал его не использует, а паттерны (загрузка в effect и т.п.)
    // идиоматичны и не являются багами. Классические rules-of-hooks/exhaustive-deps
    // остаются включёнными.
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off",
      "react-hooks/refs": "off",
      "react-hooks/purity": "off",
    },
  },
]);

export default eslintConfig;
