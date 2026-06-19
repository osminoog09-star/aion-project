"use client";

import { useEffect, useState } from "react";

type StatusResponse = {
  ok: boolean;
  active: boolean;
  channels: {
    webhook: boolean;
    email: boolean;
    cron: boolean;
    supabaseWebhook: boolean;
    serviceRole: boolean;
  };
};

export function OperationsBugAlertsStatus() {
  const [status, setStatus] = useState<StatusResponse | null>(null);

  useEffect(() => {
    void fetch("/api/operations/bug-reports/status")
      .then((r) => r.json())
      .then((j) => setStatus(j as StatusResponse))
      .catch(() => setStatus(null));
  }, []);

  if (!status) return null;

  const ch = status.channels;
  const rows = [
    ["Webhook / Telegram / Slack", ch.webhook],
    ["Email (Resend)", ch.email],
    ["Vercel cron (daily backup)", ch.cron],
    ["Supabase INSERT webhook", ch.supabaseWebhook],
    ["Service role (cursor)", ch.serviceRole],
  ] as const;

  return (
    <div
      className={`mt-6 rounded-2xl border px-4 py-3 text-sm ${
        status.active
          ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-100"
          : "border-amber-400/25 bg-amber-500/10 text-amber-100"
      }`}
    >
      <p className="font-medium">
        {status.active
          ? "Уведомления владельцу настроены на сервере"
          : "Уведомления владельцу не активны — задайте env на Vercel"}
      </p>
      <ul className="mt-2 space-y-1 text-xs opacity-90">
        {rows.map(([label, on]) => (
          <li key={label}>
            {on ? "✓" : "○"} {label}
          </li>
        ))}
      </ul>
      {!status.active ? (
        <p className="mt-2 text-[11px] opacity-80">
          Минимум: BUG_REPORT_NOTIFY_WEBHOOK_URL + CRON_SECRET + OPERATIONS_SUPABASE_SERVICE_ROLE_KEY.
          См. docs/BUG-REPORT-OWNER-ALERTS.md в репозитории.
        </p>
      ) : null}
    </div>
  );
}
