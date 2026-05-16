import { Image, Platform } from "react-native";

function getImageSize(uri: string): Promise<{ w: number; h: number } | null> {
  return new Promise((resolve) => {
    Image.getSize(
      uri,
      (w, h) => resolve({ w, h }),
      () => resolve(null),
    );
  });
}

type ManipulateAction =
  | { crop: { originX: number; originY: number; width: number; height: number } }
  | { resize: { width: number } };

/**
 * Перед ML Kit: эвристика «экран по центру» на широких фото + даунскейл (память, ночные кадры).
 * Низкая уверенность в кропе → при ошибке размеров остаётся исходник.
 * На web — без изменений. Без `expo-image-manipulator` — исходный uri.
 */
export async function prepareImageForOcr(uri: string): Promise<string> {
  if (Platform.OS === "web" || !uri) return uri;
  try {
    const IM = await import("expo-image-manipulator");
    const { manipulateAsync, SaveFormat } = IM;
    const actions: ManipulateAction[] = [];
    const dim = await getImageSize(uri);
    const ratio = dim && dim.h > 0 ? dim.w / dim.h : 1;
    if (dim && ratio > 1.22) {
      const W = dim.w;
      const H = dim.h;
      const nw = Math.max(320, Math.round(W * 0.85));
      const nh = Math.max(320, Math.round(H * 0.88));
      const ox = Math.max(0, Math.round((W - nw) / 2));
      const oy = Math.max(0, Math.round((H - nh) / 2));
      if (ox + nw <= W && oy + nh <= H) {
        actions.push({ crop: { originX: ox, originY: oy, width: nw, height: nh } });
      }
    }
    actions.push({ resize: { width: 1400 } });
    const out = await manipulateAsync(uri, actions, {
      compress: 0.87,
      format: SaveFormat.JPEG,
    });
    return out.uri;
  } catch {
    return uri;
  }
}
