/** Дублируем anon URL/key здесь: EAS `expo config` не резолвит .ts-импорты из app.config. */
const AION_SUPABASE_URL = "https://eclrkusmwcrtnxqhzpky.supabase.co";
const AION_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjbHJrdXNtd2NydG54cWh6cGt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwMDU3ODEsImV4cCI6MjA5MTU4MTc4MX0.FpTqRxDFBToOCyfjJCOj2NvOwTol__4qGDgLp6Q8JUg";

const EAS_PROJECT_ID = "e3f964f4-f7ed-4a24-9608-93894096bd0e";

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() || AION_SUPABASE_URL;
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() || AION_SUPABASE_ANON_KEY;

export default {
  expo: {
    name: "AION",
    owner: "osminoog",
    /** Должен совпадать со slug проекта на expo.dev для этого EAS projectId. Сейчас: @osminoog/aion */
    slug: "aion",
    /** Bump при нативных изменениях: новый runtimeVersion (policy appVersion) + новый preview APK. */
    version: "1.1.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    scheme: "aion-driver",
    userInterfaceStyle: "dark",
    newArchEnabled: false,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#030712",
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: "com.aion.driver",
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          "AION использует геолокацию во время смены для расчёта километража и прибыли.",
      },
    },
    android: {
      package: "com.aion.driver",
      versionCode: 15,
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#030712",
      },
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: false,
          category: ["BROWSABLE", "DEFAULT"],
          data: [{ scheme: "aion-driver" }],
        },
        /** AION в списке навигаторов: Bolt (и любые приложения) отдают точку
            назначения через geo:/google.navigation: — принимаем её на карту. */
        {
          action: "VIEW",
          autoVerify: false,
          category: ["DEFAULT"],
          data: [{ scheme: "geo" }],
        },
        {
          action: "VIEW",
          autoVerify: false,
          category: ["DEFAULT"],
          data: [{ scheme: "google.navigation" }],
        },
      ],
      permissions: [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_BACKGROUND_LOCATION",
        "FOREGROUND_SERVICE",
        "FOREGROUND_SERVICE_LOCATION",
        "FOREGROUND_SERVICE_SPECIAL_USE",
        "RECEIVE_BOOT_COMPLETED",
        /** Системная орбита поверх приложений — следующие нативные шаги; без разрешения overlay не рисуем. */
        "SYSTEM_ALERT_WINDOW",
      ],
    },
    plugins: [
      "expo-router",
      "expo-secure-store",
      "expo-font",
      "expo-localization",
      [
        "expo-image-picker",
        {
          photosPermission:
            "AION использует фото для импорта экранов выплат.",
          cameraPermission:
            "AION использует камеру, чтобы снять экран выплаты.",
        },
      ],
      [
        "expo-camera",
        {
          cameraPermission:
            "AION использует камеру для захвата выплат и чеков.",
        },
      ],
      [
        "expo-location",
        {
          locationWhenInUsePermission:
            "AION использует геолокацию во время смены, чтобы считать километраж.",
          isAndroidBackgroundLocationEnabled: true,
        },
      ],
      "expo-updates",
      "expo-navigation-bar",
      [
        "expo-speech-recognition",
        {
          microphonePermission: "AION использует микрофон только после нажатия кнопки голосового ввода.",
          speechRecognitionPermission: "AION распознаёт голосовые команды для заказов и заправок.",
        },
      ],
      require("./plugins/withAionOverlayOrb"),
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      eas: {
        projectId: EAS_PROJECT_ID,
      },
      /** Пробрасывается в OTA-манифест; задайте при CI: EXPO_PUBLIC_GIT_COMMIT, EXPO_PUBLIC_OTA_RELEASE_NOTES */
      ota: {
        commitHash: process.env.EXPO_PUBLIC_GIT_COMMIT ?? "",
        releaseNotes: process.env.EXPO_PUBLIC_OTA_RELEASE_NOTES ?? "",
      },
      /** "1" = отключить Android FGS location task для активной смены (экстренный выкл). */
      disableShiftFgLocation: process.env.EXPO_PUBLIC_DISABLE_SHIFT_FG_LOCATION ?? "",
      /** Маркер тестовой сборки проверки цепочки APK/манифест (не production). */
      apkUpdatePipelineVerification: "2026-05-14-preview-test",
      aionPortalBaseUrl: process.env.EXPO_PUBLIC_AION_PORTAL_URL ?? "https://aion-com.vercel.app",
      supabaseUrl,
      supabaseAnonKey,
    },
    runtimeVersion: {
      policy: "appVersion",
    },
    /** Каналы OTA задаются в eas.json (preview / production) и привязываются к билду. */
    updates: {
      enabled: true,
      url: `https://u.expo.dev/${EAS_PROJECT_ID}`,
      /** Проверки и UI контролируются в JS (hooks/useUpdates + UpdateOverlay) для премиального UX. */
      checkAutomatically: "NEVER",
      fallbackToCacheTimeout: 0,
    },
    web: {
      bundler: "metro",
      favicon: "./assets/icon.png",
      name: "AION Operations",
      shortName: "AION",
      lang: "ru",
      themeColor: "#030712",
      backgroundColor: "#030712",
      display: "standalone",
    },
  },
};
