/**
 * On-device OCR via Google ML Kit (@react-native-ml-kit/text-recognition).
 * Merges Latin-script pass with default pass to improve mixed / noisy captures.
 */
import TextRecognition, {
  TextRecognitionScript,
} from "@react-native-ml-kit/text-recognition";
import { normalizeOcrText } from "../normalize";

function mergeRecognizedTexts(a: string, b: string): string {
  const A = a.trim();
  const B = b.trim();
  if (!A) return B;
  if (!B) return A;
  if (B.length > A.length * 1.12) return B;
  if (A.length > B.length * 1.12) return A;
  const bestByKey = new Map<string, string>();
  for (const block of [A, B]) {
    for (const line of block.split("\n")) {
      const k = line.trim().replace(/\s+/g, " ");
      if (!k) continue;
      const lk = k.toLowerCase();
      const prev = bestByKey.get(lk);
      if (!prev || k.length > prev.length) bestByKey.set(lk, k);
    }
  }
  return [...bestByKey.values()].join("\n");
}

export async function extractTextFromImage(
  imageUri: string,
): Promise<{ text: string | null; reason?: string }> {
  try {
    const latin = await TextRecognition.recognize(imageUri, TextRecognitionScript.LATIN);
    let tLatin = (latin?.text ?? "").trim();
    let tDefault = "";
    try {
      const def = await TextRecognition.recognize(imageUri);
      tDefault = (def?.text ?? "").trim();
    } catch {
      /* ignore */
    }
    let merged = mergeRecognizedTexts(tLatin, tDefault);
    if (merged.length < 10 && tLatin.length > merged.length) merged = tLatin;
    if (merged.length < 10 && tDefault.length > merged.length) merged = tDefault;
    const text = normalizeOcrText(merged);
    if (text.length > 0) return { text };
    return { text: null, reason: "empty_recognition" };
  } catch {
    return { text: null, reason: "native_ocr_unavailable" };
  }
}
