import { git } from "./exec.mjs";

/** Сообщение для eas update --message (одна строка или многострочное в кавычках в shell). */
export function buildOtaMessage({ branch, channel }) {
  const r1 = git(["log", "-1", "--pretty=format:%s (%h)"]);
  const r8 = git(["log", "-8", "--pretty=format:- %s (%h)"]);
  const subject = (r1.stdout || "ship").trim().slice(0, 400);
  const body = (r8.stdout || "").trim().slice(0, 1400);
  const head = `[${channel}] [${branch}] ${subject}`;
  if (!body) return head;
  return `${head}\n\nChangelog:\n${body}`;
}

export function buildReleaseSummary({ commitMessage, files, validateOk }) {
  const lines = [
    `validate: ${validateOk ? "passed" : "failed"}`,
    `files: ${files.length}`,
    ...files.slice(0, 24).map((f) => `  - ${f}`),
  ];
  if (files.length > 24) lines.push(`  … +${files.length - 24} more`);
  lines.push("", `commit: ${commitMessage}`);
  return lines.join("\n");
}
