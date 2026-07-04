/**
 * formatCurrency — гард от NaN/Infinity (не показывать «NaN ₽» / «∞ ₽»). node assert.
 * Run: node scripts/ci/test-format-currency.mjs
 */
import assert from "node:assert/strict";
import { compileTsModule } from "./lib/compileTsModule.mjs";

const { formatCurrency } = compileTsModule("core/utils/formatCurrency.ts");

async function main() {
  let cases = 0;

  // NaN / Infinity / -Infinity → не «NaN»/«∞», трактуется как 0.
  for (const bad of [Number.NaN, Infinity, -Infinity]) {
    const out = formatCurrency(bad, "RUB");
    assert.doesNotMatch(out, /NaN|∞|Infinity/, `плохое значение просочилось: ${out}`);
    assert.match(out, /0/, `должен отрендериться 0: ${out}`);
    cases += 1;
  }

  // Нормальные значения форматируются как обычно (цифры на месте).
  assert.match(formatCurrency(1234.5, "RUB"), /1/);
  assert.match(formatCurrency(0, "RUB"), /0/);
  cases += 1;

  console.log(`test-format-currency: ok (${cases} cases)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
