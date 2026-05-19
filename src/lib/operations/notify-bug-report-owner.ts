import type { DriverBugReportRow } from "@/lib/operations/fetch-driver-bug-reports";

function portalBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim() || process.env.VERCEL_URL?.trim();
  if (fromEnv) {
    const u = fromEnv.startsWith("http") ? fromEnv : `https://${fromEnv}`;
    return u.replace(/\/$/, "");
  }
  return "https://aion-com.vercel.app";
}

export type NotifyBugReportResult = {
  webhook: boolean;
  email: boolean;
  errors: string[];
};

export async function notifyOwnerOfBugReport(report: DriverBugReportRow): Promise<NotifyBugReportResult> {
  const errors: string[] = [];
  let webhook = false;
  let email = false;

  const bugsUrl = `${portalBaseUrl()}/operations/bugs`;
  const shortId = report.id.slice(0, 8);
  const title = `AION Driver · ${report.category} · ${shortId}`;
  const bodyText = [
    report.description,
    "",
    `Версия: ${report.app_version ?? "?"} · ${report.platform ?? "?"}`,
    `Статус: ${report.status}`,
    `Время: ${new Date(report.created_at).toLocaleString("ru-RU")}`,
    bugsUrl,
  ].join("\n");

  const hookUrl = process.env.BUG_REPORT_NOTIFY_WEBHOOK_URL?.trim();
  if (hookUrl) {
    try {
      const res = await fetch(hookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: `🐛 **${title}**`,
          embeds: [
            {
              title: report.category,
              description: report.description.slice(0, 1800),
              color: 0xf43f5e,
              fields: [
                { name: "App", value: `${report.app_version ?? "?"} / ${report.platform ?? "?"}`, inline: true },
                { name: "ID", value: report.id, inline: false },
              ],
              url: bugsUrl,
            },
          ],
        }),
      });
      if (res.ok) webhook = true;
      else errors.push(`webhook HTTP ${res.status}`);
    } catch (e) {
      errors.push(`webhook: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  const resendKey = process.env.RESEND_API_KEY?.trim();
  const toEmail = process.env.OWNER_ALERT_EMAIL?.trim();
  const fromEmail = process.env.OWNER_ALERT_FROM?.trim() || "AION Ops <onboarding@resend.dev>";
  if (resendKey && toEmail) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [toEmail],
          subject: title,
          text: bodyText,
        }),
      });
      if (res.ok) email = true;
      else {
        const errBody = await res.text().catch(() => "");
        errors.push(`resend HTTP ${res.status} ${errBody.slice(0, 120)}`);
      }
    } catch (e) {
      errors.push(`resend: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return { webhook, email, errors };
}

export function bugReportNotifyConfigured(): boolean {
  return Boolean(
    process.env.BUG_REPORT_NOTIFY_WEBHOOK_URL?.trim() ||
      (process.env.RESEND_API_KEY?.trim() && process.env.OWNER_ALERT_EMAIL?.trim()),
  );
}
