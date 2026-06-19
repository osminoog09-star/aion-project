import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

export const driverRoot = path.resolve(import.meta.dirname, "../../..");

export function compileTsModule(relativePath, requireMap = {}) {
  const filename = path.join(driverRoot, relativePath);
  const source = fs.readFileSync(filename, "utf8");
  const js = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
    fileName: filename,
  }).outputText;

  const module = { exports: {} };
  const context = {
    exports: module.exports,
    module,
    process,
    require(specifier) {
      if (specifier in requireMap) return requireMap[specifier];
      throw new Error(`Unexpected require from ${relativePath}: ${specifier}`);
    },
  };
  vm.runInNewContext(js, context, { filename });
  return module.exports;
}
