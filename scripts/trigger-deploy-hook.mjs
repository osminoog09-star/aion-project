/**
 * POST VERCEL_DEPLOY_HOOK to promote a fresh production build.
 */
const hook = process.env.VERCEL_DEPLOY_HOOK?.trim();
if (!hook) {
  console.error("Set VERCEL_DEPLOY_HOOK to the Deploy Hook URL from Vercel project settings.");
  process.exit(1);
}

const res = await fetch(hook, { method: "POST" });
if (!res.ok) {
  console.error("Deploy hook failed:", res.status, await res.text());
  process.exit(1);
}
console.log("OK: production deploy hook triggered");
