# Owner alerts on Driver bug reports

## Env (Vercel)

| Variable | Purpose |
|----------|---------|
| `BUG_REPORT_NOTIFY_WEBHOOK_URL` | Discord/Slack/Telegram-compatible JSON webhook |
| `RESEND_API_KEY` + `OWNER_ALERT_EMAIL` | Optional email via Resend |
| `BUG_REPORT_WEBHOOK_SECRET` | Auth for Supabase Database Webhook → portal |
| `CRON_SECRET` | Auth for Vercel cron `GET /api/cron/bug-report-alerts` (every 5 min backup) |
| `OPERATIONS_SUPABASE_SERVICE_ROLE_KEY` | Cursor for last notified report id |

## Supabase Database Webhook (instant)

1. Supabase → Database → Webhooks → Create on `driver_bug_reports` INSERT.
2. URL: `https://aion-com.vercel.app/api/operations/bug-reports/notify`
3. Header: `x-aion-webhook-secret: <BUG_REPORT_WEBHOOK_SECRET>`
4. Payload: default (includes `record`).

## Cron backup

Vercel cron calls `/api/cron/bug-report-alerts` every 5 minutes. First run only seeds cursor (no spam on history).
