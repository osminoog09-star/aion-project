/**
 * Expo config plugin: Kotlin overlay + FGS + boot receiver; копирует sources; MainApplication package.
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
  "AionOverlayOrbPackage.kt",
  "AionOverlayOrbModule.kt",
  "OrbWindowManager.kt",
  "OrbPersistence.kt",
  "AionOverlayOrbService.kt",
  "AionOrbBootReceiver.kt",
];

function ensureUsesPermission(manifest, name) {
  if (!manifest["uses-permission"]) {
    manifest["uses-permission"] = [];
  }
  const list = Array.isArray(manifest["uses-permission"])
    ? manifest["uses-permission"]
    : [manifest["uses-permission"]];
  manifest["uses-permission"] = list;
  if (!list.some((p) => p.$["android:name"] === name)) {
    list.push({ $: { "android:name": name } });
  }
}

function withAionOverlayOrb(config) {
  config = withDangerousMod(config, [
    "android",
    async (cfg) => {
      const projectRoot = cfg.modRequest.projectRoot;
      const platformRoot = cfg.modRequest.platformProjectRoot;
      const srcDir = path.join(projectRoot, "native-modules", "aion-overlay-orb");
      const destDir = path.join(
        platformRoot,
        "app",
        "src",
        "main",
        "java",
        "com",
        "aion",
        "driver",
        "orb",
      );
      fs.mkdirSync(destDir, { recursive: true });
      for (const f of NATIVE_FILES) {
        fs.copyFileSync(path.join(srcDir, f), path.join(destDir, f));
      }
      return cfg;
    },
  ]);

  config = withAndroidManifest(config, (cfg) => {
    const { manifest } = cfg.modResults;
    ensureUsesPermission(manifest, "android.permission.RECEIVE_BOOT_COMPLETED");
    ensureUsesPermission(manifest, "android.permission.FOREGROUND_SERVICE_SPECIAL_USE");

    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(cfg.modResults);

    const ensureChildArray = (key) => {
      if (!app[key]) app[key] = [];
      if (!Array.isArray(app[key])) app[key] = [app[key]];
      return app[key];
    };

    const services = ensureChildArray("service");
    if (!services.some((s) => s.$["android:name"] === ".orb.AionOverlayOrbService")) {
      services.push({
        $: {
          "android:name": ".orb.AionOverlayOrbService",
          "android:exported": "false",
          "android:foregroundServiceType": "specialUse",
        },
        property: [
          {
            $: {
              "android:name": "android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE",
              "android:value": "AION overlay orb persistence (internal)",
            },
          },
        ],
      });
    }

    const receivers = ensureChildArray("receiver");
    if (!receivers.some((r) => r.$["android:name"] === ".orb.AionOrbBootReceiver")) {
      receivers.push({
        $: {
          "android:name": ".orb.AionOrbBootReceiver",
          "android:exported": "true",
        },
        "intent-filter": [
          {
            action: [{ $: { "android:name": "android.intent.action.BOOT_COMPLETED" } }],
          },
        ],
      });
    }

    return cfg;
  });

  config = withMainApplication(config, (cfg) => {
    if (cfg.modResults.language !== "kt") {
      throw new Error(
        `withAionOverlayOrb: MainApplication must be Kotlin (.kt), got ${cfg.modResults.language}`,
      );
    }
    let contents = cfg.modResults.contents;
    if (contents.includes("AionOverlayOrbPackage()")) {
      return cfg;
    }
    if (!contents.includes("import com.facebook.react.ReactPackage")) {
      throw new Error("withAionOverlayOrb: unexpected MainApplication imports");
    }
    contents = contents.replace(
      "import com.facebook.react.ReactPackage\n",
      "import com.facebook.react.ReactPackage\nimport com.aion.driver.orb.AionOverlayOrbPackage\n",
    );
    contents = contents.replace(
      "return packages",
      "packages.add(AionOverlayOrbPackage())\n            return packages",
    );
    cfg.modResults.contents = contents;
    return cfg;
  });

  return config;
}

module.exports = withAionOverlayOrb;
