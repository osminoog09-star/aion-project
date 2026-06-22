import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
import vm from "node:vm";
import { createHash, timingSafeEqual } from "node:crypto";

const source = readFileSync("src/lib/operations/secure-secret.ts", "utf8");
const output = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const module = { exports: {} };
vm.runInNewContext(output, {
  module,
  exports: module.exports,
  require: () => ({ createHash, timingSafeEqual }),
});
const { secureSecretMatches } = module.exports;

const secret = "0123456789abcdef";
assert.equal(secureSecretMatches(secret, secret), true);
assert.equal(secureSecretMatches("0123456789abcdeg", secret), false);
assert.equal(secureSecretMatches("short", secret), false);
assert.equal(secureSecretMatches(secret, "short"), false);
assert.equal(secureSecretMatches(null, secret), false);

console.log("secure secret comparison: OK (constant-time digest comparison)");
