/**
 * Чистый парсер голосовых команд водителя (рус). Без зависимостей от native —
 * тестируется детерминированно в scripts/ci/test-voice-command.mjs.
 *
 * Поддерживает:
 *  - доход:    «доход 1200», «заработал 1500», «получил 800 рублей», «плюс 500»
 *  - заправка: «заправка 3000», «заправка 3000 45», «залил 45 литров на 3500», «бензин 4000»
 *  - смена:    «начать смену», «закончить смену», «пауза», «продолжить»
 */

export type VoiceCommand =
  | { kind: "income"; amount: number }
  | { kind: "fuel"; amount: number; liters: number | null }
  | { kind: "shift"; action: "start" | "end" | "pause" | "resume" };

type NumToken = { value: number; isLiters: boolean };

/** Склеить разряды тысяч («3 000» → «3000»), не трогая отдельные числа («3000 45»). */
function collapseThousands(text: string): string {
  return text.replace(/(\d{1,3})((?:\s\d{3})+)\b/g, (m) => m.replace(/\s/g, ""));
}

function extractNumbers(text: string): NumToken[] {
  const tokens: NumToken[] = [];
  const re = /(\d+(?:[.,]\d+)?)\s*(литр\w*|л(?![а-я]))?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const value = parseFloat(m[1].replace(",", "."));
    if (!Number.isFinite(value)) continue;
    tokens.push({ value, isLiters: Boolean(m[2]) });
  }
  return tokens;
}

export function parseVoiceCommand(raw: string): VoiceCommand | null {
  if (!raw || typeof raw !== "string") return null;
  const text = collapseThousands(raw.toLowerCase().replace(/ё/g, "е").trim());
  if (!text) return null;

  // 1) Команды смены — без чисел.
  const hasShiftWord = /смен/.test(text);
  if (hasShiftWord && /(нача|начн|старт|открыт)/.test(text)) {
    return { kind: "shift", action: "start" };
  }
  if (/поехал/.test(text)) return { kind: "shift", action: "start" };
  if (hasShiftWord && /(законч|заверш|закрыт|конец|стоп)/.test(text)) {
    return { kind: "shift", action: "end" };
  }
  if (/(^|\s)(пауза|перерыв|стоп)(\s|$)/.test(text) && !hasShiftWord) {
    return { kind: "shift", action: "pause" };
  }
  if (/(продолж|возобнов|дальше)/.test(text)) {
    return { kind: "shift", action: "resume" };
  }

  const nums = extractNumbers(text);
  const isFuel = /(заправ|топлив|бензин|солярк|дизел|залил|залит)/.test(text);
  const isIncome = /(доход|заработ|получил|приход|плюс|заказ|выручк|оплат)/.test(text);

  // 2) Заправка.
  if (isFuel) {
    if (!nums.length) return null;
    const litersToken = nums.find((n) => n.isLiters);
    const money = nums.filter((n) => !n.isLiters);
    if (litersToken) {
      const amount = money.length ? Math.max(...money.map((n) => n.value)) : null;
      if (amount == null || amount <= 0) return null;
      return { kind: "fuel", amount, liters: litersToken.value };
    }
    if (nums.length >= 2) {
      const sorted = nums.map((n) => n.value).sort((a, b) => b - a);
      return { kind: "fuel", amount: sorted[0]!, liters: sorted[1]! };
    }
    const amount = nums[0]!.value;
    if (amount <= 0) return null;
    return { kind: "fuel", amount, liters: null };
  }

  // 3) Доход.
  if (isIncome) {
    if (!nums.length) return null;
    const amount = Math.max(...nums.map((n) => n.value));
    if (amount <= 0) return null;
    return { kind: "income", amount };
  }

  return null;
}

/** Краткое русское описание команды для подтверждения (без символа валюты). */
export function describeVoiceCommand(cmd: VoiceCommand): string {
  switch (cmd.kind) {
    case "income":
      return `Доход: ${cmd.amount}`;
    case "fuel":
      return cmd.liters != null
        ? `Заправка: ${cmd.amount} · ${cmd.liters} л`
        : `Заправка: ${cmd.amount}`;
    case "shift":
      return {
        start: "Начать смену",
        end: "Закончить смену",
        pause: "Поставить на паузу",
        resume: "Продолжить смену",
      }[cmd.action];
  }
}
