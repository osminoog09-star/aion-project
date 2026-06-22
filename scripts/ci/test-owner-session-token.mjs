import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHmac, createHash, timingSafeEqual } from "node:crypto";
import ts from "typescript";
import vm from "node:vm";

const compile = (file, requireMap) => {
  const source = readFileSync(file, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const compiledModule = { exports: {} };
  vm.runInNewContext(output, {
    module: compiledModule,
    exports: compiledModule.exports,
    require: (id) => requireMap[id] ?? requireMap.default?.(id),
  });
  return compiledModule.exports;
};

const secureSecret = compile("src/lib/operations/secure-secret.ts", {
  "node:crypto": { createHash, timingSafeEqual },
});
const token = compile("src/lib/operations/owner-session-token.ts", {
  "node:crypto": { createHmac },
  "@/lib/operations/secure-secret": secureSecret,
});

const secret = "owner-secret-0123456789";
const now = Date.UTC(2026, 5, 23, 12, 0, 0);
const value = token.buildOwnerSessionToken(secret, now);

assert.equal(token.verifyOwnerSessionToken(value, secret, now), true);
assert.equal(token.verifyOwnerSessionToken(value, secret, now + 7 * 24 * 60 * 60 * 1000), true);
assert.equal(token.verifyOwnerSessionToken(value, secret, now + 7 * 24 * 60 * 60 * 1000 + 1000), false);
assert.equal(token.verifyOwnerSessionToken(value, "different-owner-secret", now), false);
assert.equal(token.verifyOwnerSessionToken(`${value.slice(0, -1)}0`, secret, now), false);
assert.equal(token.verifyOwnerSessionToken("legacy-static-signature", secret, now), false);
assert.equal(token.verifyOwnerSessionToken("v2.999999999999999999999.abc", secret, now), false);
assert.equal(
  token.verifyOwnerSessionToken(token.buildOwnerSessionToken(secret, now + 6 * 60 * 1000), secret, now),
  false,
);

console.log("owner session token: OK (signed TTL, tamper and future-time rejection)");
