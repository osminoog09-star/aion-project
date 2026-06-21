import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
import vm from "node:vm";

const source = readFileSync("src/lib/operations/priorities-persist-policy.ts", "utf8");
const transpiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const sandbox = { exports: {}, module: { exports: {} }, require: () => ({}) };
sandbox.module.exports = sandbox.exports;
vm.runInNewContext(transpiled, sandbox);
const { shouldAllowPrioritiesFilesystemWrite } = sandbox.module.exports;

assert.equal(shouldAllowPrioritiesFilesystemWrite({}), true);
assert.equal(shouldAllowPrioritiesFilesystemWrite({ OPERATIONS_ALLOW_FS_WRITE: "0" }), false);
assert.equal(shouldAllowPrioritiesFilesystemWrite({ VERCEL: "1" }), false);
assert.equal(
  shouldAllowPrioritiesFilesystemWrite({ VERCEL: "1", OPERATIONS_ALLOW_FS_WRITE: "1" }),
  true,
);

console.log("priorities persistence policy: OK (Supabase-first on Vercel)");
