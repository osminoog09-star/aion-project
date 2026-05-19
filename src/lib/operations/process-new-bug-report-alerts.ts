import {
  readBugReportAlertCursor,
  writeBugReportAlertCursor,
} from "@/lib/operations/bug-report-alert-cursor";
import type { DriverBugReportRow } from "@/lib/operations/fetch-driver-bug-reports";
import { fetchDriverBugReports } from "@/lib/operations/fetch-driver-bug-reports";
import {
  bugReportNotifyConfigured,
  notifyOwnerOfBugReport,
} from "@/lib/operations/notify-bug-report-owner";

export type ProcessBugAlertsResult = {
  configured: boolean;
  scanned: number;
  notified: number;
  initializedCursor: boolean;
  errors: string[];
};

/** Уведомить о отчётах новее курсора (список по убыванию created_at). */
export async function processNewBugReportAlerts(limit = 25): Promise<ProcessBugAlertsResult> {
  const errors: string[] = [];
  if (!bugReportNotifyConfigured()) {
    return { configured: false, scanned: 0, notified: 0, initializedCursor: false, errors };
  }

  const cursor = await readBugReportAlertCursor();
  const reports = await fetchDriverBugReports(limit);
  if (reports.length === 0) {
    return { configured: true, scanned: 0, notified: 0, initializedCursor: false, errors };
  }

  if (!cursor.lastNotifiedId) {
    await writeBugReportAlertCursor({
      lastNotifiedId: reports[0].id,
      lastNotifiedAt: new Date().toISOString(),
    });
    return { configured: true, scanned: reports.length, notified: 0, initializedCursor: true, errors };
  }

  const pending: DriverBugReportRow[] = [];
  for (const r of reports) {
    if (r.id === cursor.lastNotifiedId) break;
    pending.push(r);
  }

  pending.sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at));

  let notified = 0;
  for (const report of pending) {
    const result = await notifyOwnerOfBugReport(report);
    if (result.webhook || result.email) {
      notified += 1;
      await writeBugReportAlertCursor({
        lastNotifiedId: report.id,
        lastNotifiedAt: new Date().toISOString(),
      });
    } else if (result.errors.length) {
      errors.push(...result.errors);
    }
  }

  return {
    configured: true,
    scanned: reports.length,
    notified,
    initializedCursor: false,
    errors,
  };
}

/** Немедленно при INSERT (webhook Supabase). */
export async function notifySingleBugReportIfNew(
  report: DriverBugReportRow,
): Promise<{ sent: boolean; errors: string[] }> {
  if (!bugReportNotifyConfigured()) {
    return { sent: false, errors: ["notify not configured"] };
  }
  const cursor = await readBugReportAlertCursor();
  if (cursor.lastNotifiedId === report.id) {
    return { sent: false, errors: [] };
  }
  const result = await notifyOwnerOfBugReport(report);
  if (result.webhook || result.email) {
    await writeBugReportAlertCursor({
      lastNotifiedId: report.id,
      lastNotifiedAt: new Date().toISOString(),
    });
    return { sent: true, errors: result.errors };
  }
  return { sent: false, errors: result.errors };
}
