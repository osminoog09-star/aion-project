export { defaultLocale, locales, type Locale } from "./config";
export {
  createTranslator,
  getDictionary,
  getTranslations,
  t,
  type Translator,
} from "./get-translations";
export {
  confidenceLabel,
  deployStatusLabel,
  priorityLevelLabel,
  priorityStatusLabel,
  renderCheckLabel,
  reviewStatusLabel,
  routeCheckLabel,
  validationLabel,
} from "./display";
export type { Messages } from "./locales/ru";
