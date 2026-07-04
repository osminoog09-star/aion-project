import assert from "node:assert/strict";
import { compileTsModule } from "./lib/compileTsModule.mjs";
const { parseDriverVoiceCommand } = compileTsModule("features/voice/parseDriverVoiceCommand.ts");
const plain = (value) => JSON.parse(JSON.stringify(value));
assert.deepEqual(plain(parseDriverVoiceCommand("добавь заказ на 4 евро")), { kind: "income", amount: 4, count: 1, total: 4, currencyCode: "EUR", transcript: "добавь заказ на 4 евро" });
assert.deepEqual(plain(parseDriverVoiceCommand("добавь 3 заказа по 4,50 евро")), { kind: "income", amount: 4.5, count: 3, total: 13.5, currencyCode: "EUR", transcript: "добавь 3 заказа по 4,50 евро" });
assert.deepEqual(plain(parseDriverVoiceCommand("заправился на 50 евро")), { kind: "fuel", amount: 50, currencyCode: "EUR", transcript: "заправился на 50 евро" });
assert.deepEqual(plain(parseDriverVoiceCommand("добавь три заказа по четыре евро")), { kind: "income", amount: 4, count: 3, total: 12, currencyCode: "EUR", transcript: "добавь три заказа по четыре евро" });
assert.deepEqual(plain(parseDriverVoiceCommand("заправился на сто двадцать евро")), { kind: "fuel", amount: 120, currencyCode: "EUR", transcript: "заправился на сто двадцать евро" });
assert.equal(parseDriverVoiceCommand("случайный текст"), null);
assert.equal(parseDriverVoiceCommand("добавь заказ"), null);
assert.equal(parseDriverVoiceCommand("добавь 99 заказов по 2 евро"), null);
// Отметки заказа (классы км) — руки на руле.
assert.deepEqual(plain(parseDriverVoiceCommand("Подача")), { kind: "order_activity", action: "pickup", transcript: "Подача" });
assert.deepEqual(plain(parseDriverVoiceCommand("еду за пассажиром")), { kind: "order_activity", action: "pickup", transcript: "еду за пассажиром" });
assert.deepEqual(plain(parseDriverVoiceCommand("везу пассажира")), { kind: "order_activity", action: "on_order", transcript: "везу пассажира" });
assert.deepEqual(plain(parseDriverVoiceCommand("посадил")), { kind: "order_activity", action: "on_order", transcript: "посадил" });
assert.deepEqual(plain(parseDriverVoiceCommand("высадил")), { kind: "order_activity", action: "end", transcript: "высадил" });
assert.deepEqual(plain(parseDriverVoiceCommand("свободен")), { kind: "order_activity", action: "end", transcript: "свободен" });
// «заказ» с суммой по-прежнему доход, не отметка.
assert.equal(parseDriverVoiceCommand("добавь заказ на 6 евро").kind, "income");
console.log("voice command parser: OK (15 cases)");
