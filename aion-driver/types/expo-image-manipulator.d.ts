/** Минимальные типы до установки пакета (Expo SDK 52). */
declare module "expo-image-manipulator" {
  export enum SaveFormat {
    JPEG = "jpeg",
    PNG = "png",
  }
  export function manipulateAsync(
    uri: string,
    actions: (
      | { resize?: { width?: number; height?: number } }
      | { crop: { originX: number; originY: number; width: number; height: number } }
    )[],
    options?: { compress?: number; format?: SaveFormat },
  ): Promise<{ uri: string }>;
}
