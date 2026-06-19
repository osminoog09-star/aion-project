import { requiresDriverApkBuild } from "./lib/driver-apk-build-paths.mjs";

const paths = process.argv.slice(2).filter(Boolean);
process.stdout.write(requiresDriverApkBuild(paths) ? "true" : "false");
