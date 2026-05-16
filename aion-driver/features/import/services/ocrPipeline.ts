import type { OcrParseResult, PayoutPlatform } from "../types";
import { featureFlags } from "../../../lib/featureFlags";
import { enrichOcrStructuredExtracts } from "../extraction/enrichOcrStructuredExtracts";
import { normalizeOcrText } from "../../ocr/normalize";
import { mergeOcrEngineBatch, runOcrEngineOnText } from "../../ocr/pipeline/runOcrEngine";
import { prepareImageForOcr } from "../../ocr/preprocess/prepareImageForOcr";
import { extractTextFromImage } from "../../ocr/extract/imageText";
import { ocrEngineResultToParse } from "./ocrParseMapper";
import { mockParsePayout } from "./mockOcrParsers";
import type { OcrEngineResult } from "../../ocr/types";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type OcrProgressListener = (label: string, phase: number) => void;

export type OcrPipelineInput = {
  /** Один или несколько снимков (текст извлекается, когда движок доступен). */
  imageUris: string[];
  /** Текст выписки из буфера — основной production-путь без нативного OCR. */
  pastedText?: string | null;
  platform: PayoutPlatform;
  currencyCode: string;
};

function emptyResult(
  platform: PayoutPlatform,
  currencyCode: string,
): OcrEngineResult {
  return {
    platform,
    trips: [],
    globalConfidence: 0,
    needsEditMode: true,
    analytics: null,
    tips: 0,
    bonus: 0,
    hoursOnline: null,
    currencyCode: currencyCode.toUpperCase(),
    modelVersion: "aion-ocr-engine/2.0",
    textSource: "on_device_engine",
    notes: [
      "Текст не получен: вставьте выплату из буфера или сделайте кадр с чётким текстом. Для скриншотов нужна сборка приложения с Google ML Kit (не работает в Expo Go).",
    ],
  };
}

/**
 * OCR → нормализация → детект платформы → разбор поездок → аналитика.
 * Без текста и без QA-mock не генерируются фиктивные суммы.
 */
export async function runOcrPipeline(
  input: OcrPipelineInput,
  onProgress?: OcrProgressListener,
): Promise<OcrParseResult> {
  const { imageUris, pastedText, platform, currencyCode } = input;
  const cur = currencyCode.toUpperCase();

  onProgress?.("Нормализация текста…", 0);
  await delay(120);

  const paste = pastedText?.trim();
  if (paste) {
    onProgress?.("Детект платформы и разбор поездок…", 1);
    await delay(160);
    const nt = normalizeOcrText(paste);
    const engine = runOcrEngineOnText({
      normalizedText: nt,
      platformHint: platform,
      currencyFallback: cur,
      textSource: "pasted",
    });
    onProgress?.("Аналитика…", 2);
    await delay(100);
    const parse = ocrEngineResultToParse(engine, imageUris.length ? imageUris : undefined);
    return enrichOcrStructuredExtracts(parse, nt);
  }

  onProgress?.("Извлечение текста со скриншотов…", 1);
  const engines: OcrEngineResult[] = [];
  const textChunks: string[] = [];
  for (let i = 0; i < imageUris.length; i++) {
    const uri = imageUris[i];
    onProgress?.(`Снимок ${i + 1}/${imageUris.length}: подготовка…`, 0);
    const prepared = await prepareImageForOcr(uri);
    onProgress?.(`Снимок ${i + 1}/${imageUris.length}: распознавание…`, 1);
    const { text, reason } = await extractTextFromImage(prepared);
    if (text?.trim()) {
      const nt = normalizeOcrText(text);
      textChunks.push(nt);
      const engine = runOcrEngineOnText({
        normalizedText: nt,
        platformHint: platform,
        currencyFallback: cur,
        textSource: "on_device_engine",
      });
      engines.push(engine);
    } else if (reason === "native_ocr_unavailable" && engines.length === 0 && i === imageUris.length - 1) {
      onProgress?.("OCR: нативный модуль недоступен — вставьте текст вручную.", 1);
    }
    await delay(80);
  }

  if (engines.length) {
    const mergedEngine =
      engines.length === 1 ? engines[0]! : mergeOcrEngineBatch(engines)!;
    onProgress?.("Аналитика…", 2);
    await delay(100);
    const parse = ocrEngineResultToParse(mergedEngine, imageUris);
    const joined = textChunks.join("\n\n");
    return enrichOcrStructuredExtracts(parse, joined || null);
  }

  if (featureFlags.ocrDevMock && imageUris[0]) {
    onProgress?.("QA mock-парсер…", 2);
    await delay(200);
    const parse = mockParsePayout(imageUris[0], platform, cur);
    return enrichOcrStructuredExtracts(parse, null);
  }

  onProgress?.("Готово", 3);
  await delay(60);
  const parse = ocrEngineResultToParse(emptyResult(platform, cur), imageUris);
  return enrichOcrStructuredExtracts(parse, null);
}
