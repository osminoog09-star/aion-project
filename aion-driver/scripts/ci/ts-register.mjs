/**
 * Регистрирует resolve-хук ./ts-resolve.mjs для текущего node-процесса.
 * Подключается через `node --import ./scripts/ci/ts-register.mjs <test>`.
 */
import { register } from "node:module";

register("./ts-resolve.mjs", import.meta.url);
