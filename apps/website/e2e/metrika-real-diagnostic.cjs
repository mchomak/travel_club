// Opt-in diagnostic. Runs the current Metrika initialization against real tag.js,
// intercepts all third-party traffic, and intentionally fails on a URL canary leak.
const { chromium } = require("playwright");
const { execFileSync } = require("node:child_process");
const { createHash } = require("node:crypto");

const base = process.env.METRIKA_PROBE_BASE_URL || "http://127.0.0.1:3100";
if (!/^http:\/\/127\.0\.0\.1:\d{1,5}\/?$/.test(base) || !new URL(base).port) {
  console.error("METRIKA_PROBE_BASE_URL must be HTTP 127.0.0.1 with an explicit port");
  process.exit(2);
}
const origin = new URL(base).origin;
const marker = "TC_SYNTHETIC_RECEIPT_CANARY_83472";
const tagUrl = "https://mc.yandex.ru/metrika/tag.js";
function decodedContains(value, needle) {
  for (let i = 0; i < 5; i++) {
    if (value.includes(needle)) return true;
    try { const next = decodeURIComponent(value); if (next === value) break; value = next; } catch { break; }
  }
  return false;
}

(async () => {
  // curl respects the local network/proxy configuration; only the public script is downloaded.
  const tag = execFileSync("curl", ["--fail", "--silent", "--show-error", "--location", "--max-time", "30", tagUrl], { maxBuffer: 2_000_000 });
  if (tag.length < 10000) throw new Error("Provider script download was unexpectedly small");
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ serviceWorkers: "block" });
    const requests = [];
    let scripts = 0;
    await context.route("**/*", async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      const provider = /(^|\.)(yandex\.(ru|com|net)|yastatic\.net)$/.test(url.hostname);
      if (provider || url.origin !== origin) {
        requests.push({ url: request.url(), method: request.method(), headers: request.headers(), body: request.postDataBuffer() });
      }
      if (url.origin === "https://mc.yandex.ru" && url.pathname === "/metrika/tag.js") {
        scripts++;
        return route.fulfill({ status: 200, contentType: "text/javascript", body: tag });
      }
      if (provider || url.origin !== origin) {
        return route.fulfill({ status: 200, body: "" });
      }
      // The probe never contacts the lead API or creates a real submission.
      if (url.pathname.startsWith("/api/leads")) return route.fulfill({ status: 404, body: "" });
      return route.continue();
    });
    const page = await context.newPage();
    await page.addInitScript(() => {
      // Mirror the current WebsiteAnalytics initialization; the tested server can
      // keep the integration disabled. The actual downloaded vendor code executes.
      const ym = (...args) => { (ym.a ||= []).push(args); };
      ym.l = Date.now();
      window.ym = ym;
      const script = document.createElement("script");
      script.src = "https://mc.yandex.ru/metrika/tag.js";
      script.referrerPolicy = "no-referrer";
      document.addEventListener("DOMContentLoaded", () => document.head.appendChild(script));
      ym(114346486, "init", { defer: true, webvisor: true, clickmap: false, trackLinks: false, trackHash: false, sendTitle: false });
      window.addEventListener("load", () => ym(114346486, "hit", location.origin + location.pathname, { referer: "", title: "" }));
    });
    // Ensure the detector can catch a doubly encoded canary and synthetic control.
    const control = "synthetic+control@example.test";
    const encodedOnce = encodeURIComponent(control);
    const encodedTwice = encodeURIComponent(encodedOnce);
    if (encodedOnce === control || encodedTwice === encodedOnce || encodedTwice.includes(control) || !decodedContains(encodedTwice, control)) throw new Error("Positive control failed");
    for (const path of ["/thanks", "/formats"]) {
      await page.goto(`${origin}${path}?receipt=${marker}#${marker}`, { waitUntil: "load" });
      await page.waitForTimeout(5000);
    }
    const loaded = await page.evaluate(() => Boolean(window.Ya));
    const watched = requests.filter((r) => new URL(r.url).pathname.startsWith("/watch/"));
    if (scripts < 2 || !loaded || watched.length === 0) throw new Error("Inconclusive: script or watch request was not observed");
    const leaks = requests.flatMap((r) => {
      const url = new URL(r.url);
      const kinds = [];
      if (decodedContains(r.url, marker)) kinds.push("url");
      if (decodedContains(r.headers.referer || "", marker)) kinds.push("referrer");
      if (r.body && decodedContains(r.body.toString("utf8"), marker)) kinds.push("text-body");
      if (kinds.length) return [{ path: url.pathname, method: r.method, kinds }];
      return [];
    });
    console.log(`tag sha256=${createHash("sha256").update(tag).digest("hex")}; loads=${scripts}; third-party requests=${requests.length}; watch requests=${watched.length}; canary leaks=${leaks.length}`);
    if (leaks.length) console.log(`leak locations=${JSON.stringify(leaks)}`);
    if (leaks.length) { console.error("FAIL: synthetic URL canary reached an intercepted provider request"); process.exitCode = 1; }
    else { console.error("INCONCLUSIVE: no URL leak observed; replay and compressed payloads are not decoded by this diagnostic"); process.exitCode = 2; }
  } finally { await browser.close(); }
})().catch((error) => { console.error(error.message); process.exitCode = 2; });

