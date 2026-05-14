# Custom domain (aion.com / www.aion.com)

## DNS checklist

- In Vercel → Project → **Domains**: add **both** `aion.com` and `www.aion.com`.
- Apply the DNS records Vercel shows (apex **A** records to Vercel anycast, or ALIAS/ANAME if your DNS supports it; `www` as **CNAME** to `cname.vercel-dns.com` or the hostname Vercel prints).
- Wait for propagation (often minutes; TTL-dependent up to 48h).

## SSL

- Vercel issues and renews **Let’s Encrypt** certificates automatically once DNS resolves to Vercel.

## Redirect strategy (pick one canonical)

- **Apex canonical:** set primary domain to `aion.com`; add redirect `www.aion.com` → `aion.com` in Vercel (automatic “Redirect to Primary Domain”).
- **www canonical:** primary `www.aion.com`; redirect apex → www.
- Set **`NEXT_PUBLIC_SITE_URL`** to the **canonical** origin (with `https://`, no trailing slash) and redeploy so sitemap/OG use the correct host.

## Validate

- `curl -I https://aion.com` (or www) → `200` and `server: Vercel`.
- Open `/robots.txt` and `/sitemap.xml` on the live host.
