import assert from "node:assert/strict";
import { compileTsModule } from "./lib/compileTsModule.mjs";

const { buildBugReportWebhookPayload } = compileTsModule("src/lib/operations/notify-bug-report-owner.ts");

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

const report = {
  id: "bug-report-1234567890",
  user_id: "owner",
  category: "sync",
  description: "Offline sync failed after shift close",
  status: "new",
  app_version: "1.0.9",
  platform: "android",
  diagnostic_log: null,
  diagnostics: null,
  created_at: "2026-06-19T11:00:00.000Z",
  updated_at: "2026-06-19T11:00:00.000Z",
};

const ctx = {
  title: "AION Driver · sync · bug-repo",
  bodyText: "Offline sync failed after shift close\n\nВерсия: 1.0.9 · android",
  report,
  bugsUrl: "https://aion-com.vercel.app/operations/bugs",
};

delete process.env.BUG_REPORT_TELEGRAM_CHAT_ID;
const telegramNoChat = buildBugReportWebhookPayload("https://api.telegram.org/bot123/sendMessage", ctx);
assert.equal(telegramNoChat.chat_id, undefined);
assert.match(String(telegramNoChat.text), /AION Driver/);
assert.match(String(telegramNoChat.text), /Offline sync failed/);

process.env.BUG_REPORT_TELEGRAM_CHAT_ID = "12345";
const telegram = buildBugReportWebhookPayload("https://api.telegram.org/bot123/sendMessage", ctx);
assert.equal(telegram.chat_id, "12345");
assert.equal(telegram.disable_web_page_preview, false);
assert.match(String(telegram.text), /🐛 AION Driver/);

const slack = buildBugReportWebhookPayload("https://hooks.slack.com/services/T/B/C", ctx);
assert.deepEqual(Object.keys(slack), ["text"]);
assert.match(String(slack.text), /🐛 AION Driver/);

const discord = buildBugReportWebhookPayload("https://discord.com/api/webhooks/1/2", ctx);
assert.match(String(discord.content), /🐛 \*\*AION Driver/);
assert.equal(Array.isArray(discord.embeds), true);
assert.equal(discord.embeds[0].title, "sync");
assert.equal(discord.embeds[0].url, "https://aion-com.vercel.app/operations/bugs");
assert.deepEqual(
  plain(
  discord.embeds[0].fields.map((field) => field.name),
  ),
  ["App", "ID"],
);

console.log("test-bug-report-webhook-payload: OK");
