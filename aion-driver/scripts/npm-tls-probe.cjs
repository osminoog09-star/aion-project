const https = require("https");
https
  .get("https://registry.npmjs.org/-/ping", (r) => {
    console.log("HTTPS status:", r.statusCode);
    process.exit(r.statusCode === 200 ? 0 : 1);
  })
  .on("error", (e) => {
    console.error("HTTPS error:", e.message);
    process.exit(1);
  });
