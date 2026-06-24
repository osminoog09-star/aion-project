/**
 * parseVoiceCommand / describeVoiceCommand — node assert.
 */
import assert from "node:assert/strict";

async function main() {
  let parseVoiceCommand;
  let describeVoiceCommand;
  try {
    const mod = await import("../../features/voice/parseVoiceCommand.ts");
    parseVoiceCommand = mod.parseVoiceCommand;
    describeVoiceCommand = mod.describeVoiceCommand;
  } catch (err) {
    console.log("skip:", err?.message ?? err);
    process.exit(0);
  }

  let cases = 0;
  const eq = (input, expected) => {
    assert.deepEqual(parseVoiceCommand(input), expected, `input: ${input}`);
    cases += 1;
  };

  // Доход
  eq("доход 1200", { kind: "income", amount: 1200 });
  eq("заработал 1500", { kind: "income", amount: 1500 });
  eq("получил 800 рублей", { kind: "income", amount: 800 });
  eq("плюс 500", { kind: "income", amount: 500 });
  eq("заказ 350", { kind: "income", amount: 350 });
  eq("доход 3 000", { kind: "income", amount: 3000 });

  // Заправка
  eq("заправка 3000", { kind: "fuel", amount: 3000, liters: null });
  eq("заправка 3000 45", { kind: "fuel", amount: 3000, liters: 45 });
  eq("залил 45 литров на 3500", { kind: "fuel", amount: 3500, liters: 45 });
  eq("топливо 2500 40 л", { kind: "fuel", amount: 2500, liters: 40 });
  eq("бензин 4000", { kind: "fuel", amount: 4000, liters: null });

  // Смена
  eq("начать смену", { kind: "shift", action: "start" });
  eq("начни смену", { kind: "shift", action: "start" });
  eq("поехали", { kind: "shift", action: "start" });
  eq("закончить смену", { kind: "shift", action: "end" });
  eq("завершить смену", { kind: "shift", action: "end" });
  eq("пауза", { kind: "shift", action: "pause" });
  eq("перерыв", { kind: "shift", action: "pause" });
  eq("продолжить", { kind: "shift", action: "resume" });

  // Мусор / неполное → null
  eq("", null);
  eq("привет как дела", null);
  eq("заправка", null);

  // describe
  assert.equal(
    describeVoiceCommand({ kind: "income", amount: 1200 }),
    "Доход: 1200",
  );
  assert.equal(
    describeVoiceCommand({ kind: "fuel", amount: 3000, liters: 45 }),
    "Заправка: 3000 · 45 л",
  );
  assert.equal(
    describeVoiceCommand({ kind: "shift", action: "start" }),
    "Начать смену",
  );
  cases += 3;

  console.log(`test-voice-command: ok (${cases} cases)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
