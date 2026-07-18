/**
 * Expo config plugin: NotificationListenerService для захвата уведомлений Bolt.
 * Копирует Kotlin-сорсы, регистрирует сервис-слушатель в манифесте (с
 * BIND_NOTIFICATION_LISTENER_SERVICE) и пакет в MainApplication.
 *
 * Слушатель ИНЕРТЕН по умолчанию: работает только если пользователь явно дал
 * «Доступ к уведомлениям» для AION в настройках Android. Ничего не рисует и не
 * запускает фоновых сервисов — минимальная поверхность (урок орбиты).
 */
const fs = require("fs");
const path = require("path");
const {
  withDangerousMod,
  withMainApplication,
  withAndroidManifest,
  AndroidConfig,
} = require("expo/config-plugins");

const NATIVE_FILES = [
  "NotifBuffer.kt",
  "AionNotifListenerService.kt",
  "AionBoltReaderService.kt",
  "AionNotifCaptureModule.kt",
  "AionNotifCapturePackage.kt",
];

function withAionNotifCapture(config) {
  config = withDangerousMod(config, [
    "android",
    async (cfg) => {
      const projectRoot = cfg.modRequest.projectRoot;
      const platformRoot = cfg.modRequest.platformProjectRoot;
      const srcDir = path.join(projectRoot, "native-modules", "aion-notif-capture");
      const destDir = path.join(
        platformRoot,
        "app",
        "src",
        "main",
        "java",
        "com",
        "aion",
        "driver",
        "notif",
      );
      fs.mkdirSync(destDir, { recursive: true });
      for (const f of NATIVE_FILES) {
        fs.copyFileSync(path.join(srcDir, f), path.join(destDir, f));
      }
      // Конфиг accessibility-читалки → res/xml/
      const resXmlDir = path.join(platformRoot, "app", "src", "main", "res", "xml");
      fs.mkdirSync(resXmlDir, { recursive: true });
      fs.copyFileSync(
        path.join(srcDir, "aion_bolt_reader_config.xml"),
        path.join(resXmlDir, "aion_bolt_reader_config.xml"),
      );
      return cfg;
    },
  ]);

  config = withAndroidManifest(config, (cfg) => {
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(cfg.modResults);

    const ensureChildArray = (key) => {
      if (!app[key]) app[key] = [];
      if (!Array.isArray(app[key])) app[key] = [app[key]];
      return app[key];
    };

    const services = ensureChildArray("service");
    if (!services.some((s) => s.$["android:name"] === ".notif.AionNotifListenerService")) {
      services.push({
        $: {
          "android:name": ".notif.AionNotifListenerService",
          "android:exported": "false",
          "android:label": "AION — захват заказов",
          "android:permission": "android.permission.BIND_NOTIFICATION_LISTENER_SERVICE",
        },
        "intent-filter": [
          {
            action: [
              {
                $: {
                  "android:name": "android.service.notification.NotificationListenerService",
                },
              },
            ],
          },
        ],
      });
    }

    if (!services.some((s) => s.$["android:name"] === ".notif.AionBoltReaderService")) {
      services.push({
        $: {
          "android:name": ".notif.AionBoltReaderService",
          "android:exported": "false",
          "android:label": "AION — читалка заказов Bolt",
          "android:permission": "android.permission.BIND_ACCESSIBILITY_SERVICE",
        },
        "intent-filter": [
          {
            action: [
              {
                $: {
                  "android:name": "android.accessibilityservice.AccessibilityService",
                },
              },
            ],
          },
        ],
        "meta-data": [
          {
            $: {
              "android:name": "android.accessibilityservice",
              "android:resource": "@xml/aion_bolt_reader_config",
            },
          },
        ],
      });
    }

    return cfg;
  });

  config = withMainApplication(config, (cfg) => {
    if (cfg.modResults.language !== "kt") {
      throw new Error(
        `withAionNotifCapture: MainApplication must be Kotlin (.kt), got ${cfg.modResults.language}`,
      );
    }
    let contents = cfg.modResults.contents;
    if (contents.includes("AionNotifCapturePackage()")) {
      return cfg;
    }
    if (!contents.includes("import com.facebook.react.ReactPackage")) {
      throw new Error("withAionNotifCapture: unexpected MainApplication imports");
    }
    contents = contents.replace(
      "import com.facebook.react.ReactPackage\n",
      "import com.facebook.react.ReactPackage\nimport com.aion.driver.notif.AionNotifCapturePackage\n",
    );
    contents = contents.replace(
      "return packages",
      "packages.add(AionNotifCapturePackage())\n            return packages",
    );
    cfg.modResults.contents = contents;
    return cfg;
  });

  return config;
}

module.exports = withAionNotifCapture;
