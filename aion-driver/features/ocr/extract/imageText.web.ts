/**
 * Web: нативный OCR недоступен — текст только из вставки или внешнего пайплайна.
 */
export async function extractTextFromImage(
  _imageUri: string,
): Promise<{ text: string | null; reason?: string }> {
  return { text: null, reason: "native_ocr_unavailable" };
}
