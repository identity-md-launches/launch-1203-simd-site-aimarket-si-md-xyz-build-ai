import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { demoSnapshot } from "../src/data.ts";

const dist =
  process.env.SITE_DIST ??
  fileURLToPath(new URL("../../dist", import.meta.url));
const artifacts =
  process.env.VALIDATION_DIR ??
  fileURLToPath(new URL("../../artifacts", import.meta.url));
await mkdir(artifacts, { recursive: true });
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".woff2": "font/woff2",
  ".svg": "image/svg+xml",
};
const server = createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  const relative = decodeURIComponent(url.pathname).replace(/^\/preview\//, "");
  if (!url.pathname.startsWith("/preview/") || relative.includes("..")) {
    res.writeHead(404);
    res.end();
    return;
  }
  try {
    const file = path.join(dist, relative || "index.html");
    const bytes = await readFile(file);
    res.writeHead(200, {
      "Content-Type": types[path.extname(file)] ?? "application/octet-stream",
    });
    res.end(bytes);
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}/preview/`;
const result = {
  startedAt: new Date().toISOString(),
  browser: "Chromium",
  checks: [],
  audits: [],
  viewports: [],
  consoleErrors: [],
  failedResources: [],
  externalRequests: [],
  contrast: [],
  limitations: [
    "No physical device or screen-reader session.",
    "720px CSS viewport tests zoom-equivalent reflow; native browser zoom and text-only enlargement are unperformed.",
    "Backend requests are mocked; no provider authorization or deployed backend is claimed.",
  ],
};
let browser;
let page;
const check = async (name, fn) => {
  await fn();
  result.checks.push({ name, status: "passed" });
  console.log(`PASS ${name}`);
};
const save = async (name, fullPage = false) =>
  page.screenshot({ path: path.join(artifacts, name), fullPage });
const waitText = async (locator, text) => {
  await locator.filter({ hasText: text }).first().waitFor();
};
const noOverflow = async (width) => {
  await page.setViewportSize({ width, height: 900 });
  await page.evaluate(() => document.fonts.ready);
  const actual = await page.evaluate(
    () => document.documentElement.scrollWidth,
  );
  assert.ok(actual <= width, `${actual}px overflows ${width}px`);
  result.viewports.push({ width, scrollWidth: actual });
};
const go = async (tab) => {
  await page.locator(`.sidebar nav a[href="#${tab}"]`).click();
  assert.equal(new URL(page.url()).hash, `#${tab}`);
};
const audit = async (name) => {
  const report = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  const violations = report.violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    nodes: v.nodes.map((n) => ({
      target: n.target,
      summary: n.failureSummary,
    })),
  }));
  result.audits.push({ name, violations });
  assert.equal(violations.length, 0, JSON.stringify(violations));
};
try {
  browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROMIUM_PATH
      ? { executablePath: process.env.CHROMIUM_PATH }
      : {}),
    args: ["--no-sandbox"],
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
    acceptDownloads: true,
  });
  page = await context.newPage();
  page.setDefaultTimeout(7000);
  page.on("pageerror", (error) => result.consoleErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") result.consoleErrors.push(message.text());
  });
  page.on("requestfailed", (req) =>
    result.failedResources.push({
      url: req.url(),
      error: req.failure()?.errorText,
    }),
  );
  page.on("request", (req) => {
    if (!req.url().startsWith(base) && !req.url().startsWith("blob:"))
      result.externalRequests.push(req.url());
  });
  await page.goto(base, { waitUntil: "networkidle" });
  await check(
    "Traditional Chinese is the default; nested static assets load locally",
    async () => {
      assert.equal(await page.locator("html").getAttribute("lang"), "zh-Hant");
      assert.match(await page.locator("main h1").innerText(), /看懂訊號/);
      assert.equal(result.externalRequests.length, 0);
      assert.equal(result.failedResources.length, 0);
      assert.equal(await page.locator(".setup-card").count(), 3);
      const fonts = await page.evaluate(async () => {
        await document.fonts.ready;
        return [...document.fonts].map((f) => ({
          family: f.family,
          status: f.status,
          weight: f.weight,
        }));
      });
      assert.ok(
        fonts
          .filter((f) => f.family === "IBM Plex Mono")
          .every((f) => f.status === "loaded"),
      );
      result.fonts = fonts;
    },
  );
  await audit("Overview, Traditional Chinese, 1440px");
  await save("desktop-zh.png", true);
  await check(
    "English toggle updates document language and persists",
    async () => {
      await page.getByRole("button", { name: "Switch to English" }).click();
      assert.equal(await page.locator("html").getAttribute("lang"), "en");
      await page.reload({ waitUntil: "networkidle" });
      assert.equal(await page.locator("html").getAttribute("lang"), "en");
      await waitText(page.locator("h1"), "Less noise.");
    },
  );
  await save("desktop-en.png", true);
  await check("All nine hash routes work without server rewrites", async () => {
    for (const [id, title] of [
      ["spot", "Crypto spot"],
      ["memes", "Meme radar"],
      ["futures", "Futures"],
      ["stocks", "US stock research"],
      ["gold", "Gold & macro"],
      ["wallets", "Wallet intelligence"],
      ["watchlists", "Watchlists & alerts"],
      ["settings", "Terminal settings"],
      ["overview", "Less noise."],
    ]) {
      await go(id);
      assert.ok((await page.locator("main h1").innerText()).includes(title));
      if (["spot", "stocks", "gold", "settings"].includes(id))
        await audit(title + ", English, 1440px");
    }
    await page.goBack();
    assert.equal(new URL(page.url()).hash, "#settings");
    await page.getByRole("link", { name: "Skip to content" }).focus();
    await page.keyboard.press("Enter");
    assert.equal(new URL(page.url()).hash, "#settings");
    assert.equal(
      await page.evaluate(() => document.activeElement.id),
      "main-content",
    );
    await go("overview");
  });
  await check(
    "Chart asset, interval, chart type and keyboard candle inspection respond",
    async () => {
      await page.getByLabel("Chart asset", { exact: true }).selectOption("eth");
      assert.equal(
        await page.locator(".chart-value strong").innerText(),
        "$2,486.92",
      );
      const before = await page.locator(".price-chart").innerHTML();
      await page.getByRole("button", { name: "1D", exact: true }).click();
      assert.notEqual(await page.locator(".price-chart").innerHTML(), before);
      await page
        .getByRole("button", { name: "Line chart", exact: true })
        .click();
      assert.equal(
        await page
          .getByRole("button", { name: "Line chart", exact: true })
          .getAttribute("aria-pressed"),
        "true",
      );
      await page.getByRole("slider", { name: "Inspect candle" }).focus();
      await page.keyboard.press("Home");
      assert.equal(
        await page.getByRole("slider", { name: "Inspect candle" }).inputValue(),
        "0",
      );
      await page.keyboard.press("ArrowRight");
      assert.equal(
        await page.getByRole("slider", { name: "Inspect candle" }).inputValue(),
        "1",
      );
    },
  );
  await check(
    "Global keyboard search opens the matching research",
    async () => {
      await page.locator("h1").click();
      await page.keyboard.press("/");
      assert.equal(
        await page
          .getByRole("searchbox", { name: "Search all assets" })
          .evaluate((el) => el === document.activeElement),
        true,
      );
      await page
        .getByRole("searchbox", { name: "Search all assets" })
        .fill("SOL");
      await page
        .locator(".search-results")
        .getByRole("button", { name: /SOL/ })
        .click();
      assert.match(
        await page.getByRole("dialog").innerText(),
        /Range reversion/,
      );
      await page.keyboard.press("Escape");
      assert.equal(await page.locator("dialog[open]").count(), 0);
    },
  );
  await check(
    "Watchlist changes persist; journal records do not duplicate on reload",
    async () => {
      await go("spot");
      await page
        .getByRole("button", { name: "Unwatch BTC", exact: true })
        .click();
      await go("watchlists");
      assert.equal(await page.locator(".watch-row").count(), 2);
      const size = await page.evaluate(
        () => JSON.parse(localStorage.getItem("aimarket:v1:journal")).length,
      );
      await page.reload({ waitUntil: "networkidle" });
      assert.equal(await page.locator(".watch-row").count(), 2);
      assert.equal(
        await page.evaluate(
          () => JSON.parse(localStorage.getItem("aimarket:v1:journal")).length,
        ),
        size,
      );
      await go("spot");
      await page
        .getByRole("button", { name: "Watch BTC", exact: true })
        .click();
    },
  );
  await check(
    "Research search, direction, timeframe, empty state and accumulation tab work",
    async () => {
      await page
        .getByRole("searchbox", { name: "Search research asset or strategy" })
        .fill("no-match");
      assert.equal(await page.locator(".setup-card").count(), 0);
      await waitText(page.locator("h3"), "No matching research");
      await page.getByRole("button", { name: "Clear filters" }).click();
      assert.equal(await page.locator(".setup-card").count(), 3);
      await page.getByLabel("Direction", { exact: true }).selectOption("short");
      assert.equal(await page.locator(".setup-card").count(), 0);
      await page.getByLabel("Direction", { exact: true }).selectOption("all");
      await page.getByLabel("Timeframe", { exact: true }).selectOption("1H");
      assert.equal(await page.locator(".setup-card").count(), 1);
      assert.match(await page.locator(".setup-card").innerText(), /SOL/);
      await page.getByLabel("Timeframe", { exact: true }).selectOption("all");
      await page
        .getByRole("button", { name: "Accumulation research", exact: true })
        .click();
      assert.equal(await page.locator(".setup-card").count(), 0);
      assert.match(
        await page.locator(".accumulation").innerText(),
        /no accumulation recommendation/,
      );
      await page
        .getByRole("button", { name: "Short-term setups", exact: true })
        .click();
    },
  );
  await check(
    "Research modal exposes evidence, invalidation, costs and expiry; focus returns",
    async () => {
      const trigger = page
        .getByRole("button", { name: "View research", exact: true })
        .first();
      await trigger.focus();
      await page.keyboard.press("Enter");
      const dialog = page.getByRole("dialog");
      for (const text of [
        "Closed-candle trigger",
        "Stop / invalidation",
        "Sources & evidence",
        "Expires",
        "20 bps",
      ])
        assert.ok((await dialog.innerText()).includes(text));
      await audit("Research detail dialog, English");
      await page
        .getByRole("button", { name: "Close dialog", exact: true })
        .focus();
      await page.keyboard.press("Shift+Tab");
      assert.equal(
        await page.evaluate(() => !!document.activeElement.closest("dialog")),
        true,
      );
      await page.keyboard.press("Escape");
      assert.equal(
        await trigger.evaluate((el) => el === document.activeElement),
        true,
      );
    },
  );
  await check(
    "Futures risk sizing updates and invalid risk is recoverable",
    async () => {
      await go("futures");
      await page.getByLabel("Research capital (USD)").fill("20000");
      await page.getByLabel("Risk per idea (%)").fill("1");
      assert.match(
        await page.locator(".risk-result strong").innerText(),
        /^\$200.00/,
      );
      await page.getByLabel("Risk per idea (%)").fill("6");
      assert.equal(await page.locator(".risk-result strong").innerText(), "—");
      await page.getByLabel("Risk per idea (%)").fill("0.5");
      assert.match(
        await page.locator(".risk-result strong").innerText(),
        /^\$100.00/,
      );
      await audit("Futures, English");
    },
  );
  await check(
    "Meme convergence responds to windows and related-wallet thresholds",
    async () => {
      await go("memes");
      assert.match(
        await page.locator(".convergence").innerText(),
        /4 wallets \/ 3 independent/,
      );
      await page.getByLabel("Co-buy window").selectOption("5");
      assert.equal(await page.locator(".convergence").count(), 0);
      await page.getByLabel("Co-buy window").selectOption("60");
      await page.getByLabel("Min. independent sources").selectOption("4");
      assert.equal(await page.locator(".convergence").count(), 0);
      await page.getByLabel("Min. independent sources").selectOption("3");
      assert.equal(await page.locator(".convergence").count(), 1);
      assert.equal(await page.locator(".setup-levels").count(), 0);
      await page
        .getByRole("button", { name: "View research", exact: true })
        .click();
      assert.equal(await page.locator(".detail-grid").count(), 0);
      await page.keyboard.press("Escape");
      await audit("Meme radar, English");
    },
  );
  await check(
    "Public-wallet import validates, deduplicates and persists by chain",
    async () => {
      await go("wallets");
      await page
        .getByRole("button", { name: "Import wallet", exact: true })
        .click();
      await page.getByLabel("Public address", { exact: true }).fill("invalid");
      await page
        .getByRole("dialog")
        .getByRole("button", { name: "Import wallet", exact: true })
        .click();
      assert.equal(
        await page.locator("#wallet-address").getAttribute("aria-invalid"),
        "true",
      );
      await page
        .getByLabel("Research label (optional)")
        .fill("Research sample");
      await page
        .getByLabel("Public address", { exact: true })
        .fill("0x" + "a1".repeat(20));
      await page
        .getByRole("dialog")
        .getByRole("button", { name: "Import wallet", exact: true })
        .click();
      assert.equal(await page.locator(".wallet-list article").count(), 1);
      await page
        .getByRole("button", { name: "Import wallet", exact: true })
        .click();
      await page
        .getByLabel("Public address", { exact: true })
        .fill("0x" + "A1".repeat(20));
      await page
        .getByRole("dialog")
        .getByRole("button", { name: "Import wallet", exact: true })
        .click();
      assert.match(
        await page.locator("#wallet-error").innerText(),
        /already imported/,
      );
      await page.getByLabel("Chain", { exact: true }).selectOption("Base");
      await page
        .getByRole("dialog")
        .getByRole("button", { name: "Import wallet", exact: true })
        .click();
      assert.equal(await page.locator(".wallet-list article").count(), 2);
      await page.reload({ waitUntil: "networkidle" });
      assert.equal(await page.locator(".wallet-list article").count(), 2);
      await audit("Wallets, English");
    },
  );
  await check(
    "Alerts save as inactive drafts; exported journal retains provenance",
    async () => {
      await go("watchlists");
      await page
        .getByRole("button", { name: "Create alert", exact: true })
        .click();
      await page.getByLabel("Price (USD)").fill("65000");
      await page.getByRole("button", { name: "Save alert draft" }).click();
      assert.match(
        await page.locator(".alert-list").innerText(),
        /delivery inactive/,
      );
      const d = page.waitForEvent("download");
      await page
        .getByRole("button", { name: "Export journal", exact: true })
        .click();
      const download = await d;
      const file = await download.path();
      const journal = JSON.parse(await readFile(file, "utf8"));
      assert.equal(journal.timezone, "Asia/Taipei");
      assert.equal(journal.entries.length, 8);
      assert.ok(
        journal.entries.every(
          (e) =>
            e.mode === "Demo" &&
            e.outcome === "pending" &&
            Number.isFinite(Date.parse(e.observedAt)),
        ),
      );
      await audit("Watchlists & alerts, English");
    },
  );
  await check(
    "Settings reject unsafe URLs and show setup-required state without demo data",
    async () => {
      await go("settings");
      await page
        .getByLabel("HTTPS backend URL")
        .fill("http://backend.example.test");
      await page.getByRole("button", { name: "Connect & validate" }).click();
      assert.match(
        await page.locator("#backend-error").innerText(),
        /HTTPS URL/,
      );
      await page.getByRole("switch", { name: /Show demo data/ }).uncheck();
      await go("overview");
      assert.equal(await page.locator(".market-ticker").count(), 0);
      assert.match(
        await page.locator(".mode-bar").innerText(),
        /SETUP REQUIRED/,
      );
      await audit("Setup required, English");
    },
  );
  await check(
    "Backend schema, loading, live, delayed, cached and stale handling",
    async () => {
      const stamp = Date.now();
      const fixture = structuredClone(demoSnapshot);
      fixture.status = "Live";
      fixture.generatedAt = new Date(stamp - 60000).toISOString();
      fixture.expiresAt = new Date(stamp + 600000).toISOString();
      fixture.assets = fixture.assets.map((a) => ({
        ...a,
        status: "Live",
        asOf: fixture.generatedAt,
      }));
      fixture.setups = fixture.setups.map((s) => ({
        ...s,
        status: "Live",
        asOf: fixture.generatedAt,
        expiresAt: fixture.expiresAt,
      }));
      let payload = { version: 99 };
      let release;
      let hold = false;
      await page.route(
        "https://backend.example.test/v1/snapshot",
        async (route) => {
          if (hold) await new Promise((r) => (release = r));
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(payload),
          });
        },
      );
      await go("settings");
      await page
        .getByLabel("HTTPS backend URL")
        .fill("https://backend.example.test");
      await page.getByRole("button", { name: "Connect & validate" }).click();
      await page.locator("#backend-error").waitFor();
      assert.match(
        await page.locator("#backend-error").innerText(),
        /No valid snapshot/,
      );
      payload = fixture;
      hold = true;
      await page.getByRole("button", { name: "Connect & validate" }).click();
      assert.equal(
        await page.getByRole("button", { name: "Connecting…" }).isDisabled(),
        true,
      );
      while (!release) await new Promise((r) => setTimeout(r, 10));
      release();
      hold = false;
      await page
        .getByRole("button", { name: "Disconnect", exact: true })
        .waitFor();
      await go("overview");
      assert.match(
        await page.locator(".mode-bar").innerText(),
        /RESEARCH MODE/,
      );
      assert.match(
        await page.locator(".chart-panel").innerText(),
        /Candle history is not connected/,
      );
      assert.equal(
        await page.evaluate(
          () =>
            JSON.parse(localStorage.getItem("aimarket:v1:journal")).filter(
              (e) => e.mode === "Connected",
            ).length,
        ),
        7,
      );
      payload = { ...fixture, status: "Cached" };
      await page.getByRole("button", { name: "Refresh snapshot" }).click();
      await page
        .locator(".market-section-head .badge")
        .filter({ hasText: "Cached" })
        .waitFor();
      assert.equal(await page.locator(".setup-levels").count(), 0);
      payload = {
        ...fixture,
        status: "Delayed",
        assets: fixture.assets.map((a) => ({
          ...a,
          status: "Delayed",
          delayMinutes: 15,
        })),
        setups: fixture.setups.map((s) => ({ ...s, status: "Delayed" })),
      };
      await page.getByRole("button", { name: "Refresh snapshot" }).click();
      await page
        .locator(".market-section-head .badge")
        .filter({ hasText: "Delayed" })
        .waitFor();
      await go("stocks");
      assert.match(
        await page.locator(".stock-quotes").innerText(),
        /Delay: 15 min/,
      );
      payload = {
        ...fixture,
        generatedAt: new Date(stamp - 7200000).toISOString(),
        expiresAt: new Date(stamp - 3600000).toISOString(),
      };
      await page.getByRole("button", { name: "Refresh snapshot" }).click();
      await go("spot");
      await page
        .locator(".page-heading .badge")
        .filter({ hasText: "Stale" })
        .waitFor();
      assert.equal(await page.locator(".setup-levels").count(), 0);
      await page
        .getByRole("button", { name: "View research", exact: true })
        .first()
        .click();
      assert.equal(await page.locator(".detail-grid").count(), 0);
      await page.keyboard.press("Escape");
      const expiryBase = Date.now();
      await page.clock.install({ time: new Date(expiryBase) });
      payload = {
        ...fixture,
        generatedAt: new Date(expiryBase - 60000).toISOString(),
        expiresAt: new Date(expiryBase + 120000).toISOString(),
        assets: fixture.assets.map((a) => ({
          ...a,
          asOf: new Date(expiryBase - 60000).toISOString(),
        })),
        setups: fixture.setups.map((s) => ({
          ...s,
          asOf: new Date(expiryBase - 60000).toISOString(),
          expiresAt: new Date(expiryBase + 120000).toISOString(),
        })),
      };
      await page.getByRole("button", { name: "Refresh snapshot" }).click();
      await page
        .locator(".page-heading .badge")
        .filter({ hasText: "Live" })
        .waitFor();
      assert.equal(await page.locator(".setup-levels").count(), 3);
      await page.clock.fastForward(120001);
      await page
        .locator(".page-heading .badge")
        .filter({ hasText: "Stale" })
        .waitFor();
      assert.equal(await page.locator(".setup-levels").count(), 0);
      payload = demoSnapshot;
      await page.getByRole("button", { name: "Refresh snapshot" }).click();
      await page
        .locator(".mode-bar strong")
        .filter({ hasText: "DEMO MODE" })
        .waitFor();
      assert.equal(
        await page.evaluate(
          () =>
            JSON.parse(localStorage.getItem("aimarket:v1:journal")).filter(
              (e) => e.mode === "Connected",
            ).length,
        ),
        14,
      );
      await go("settings");
      await page
        .getByRole("button", { name: "Disconnect", exact: true })
        .click();
      await page.getByRole("switch", { name: /Show demo data/ }).check();
    },
  );
  await check(
    "Responsive reflow at 320, 390, 760, 1024 and 1440 pixels",
    async () => {
      await go("overview");
      for (const width of [320, 390, 760, 1024, 1440]) await noOverflow(width);
      await page.setViewportSize({ width: 390, height: 844 });
      await page.getByRole("button", { name: "Open navigation" }).click();
      await page
        .getByRole("dialog")
        .getByRole("link", { name: "Settings", exact: true })
        .click();
      assert.equal(await page.locator("dialog[open]").count(), 0);
      await noOverflow(320);
      await audit("Settings, English, 320px");
      await page.getByRole("button", { name: "Open navigation" }).click();
      await page
        .getByRole("dialog")
        .getByRole("link", { name: "Overview", exact: true })
        .click();
      await audit("Overview, English, 320px");
      await page.setViewportSize({ width: 390, height: 844 });
      await page.getByRole("button", { name: "切換至繁體中文" }).click();
      if (await page.getByRole("button", { name: "關閉提示" }).count())
        await page.getByRole("button", { name: "關閉提示" }).click();
      const clean = await browser.newContext({
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 1,
      });
      const shot = await clean.newPage();
      await shot.goto(base, { waitUntil: "networkidle" });
      await shot.screenshot({
        path: path.join(artifacts, "mobile-zh.png"),
        fullPage: true,
      });
      await shot.screenshot({
        path: path.join(artifacts, "mobile-viewport.png"),
      });
      await clean.close();
    },
  );
  await check(
    "Reduced motion and pause control suppress decorative animation",
    async () => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      assert.equal(
        await page
          .locator(".data-stream")
          .evaluate((el) => getComputedStyle(el).animationName),
        "none",
      );
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await page.getByRole("button", { name: "暫停背景動態" }).click();
      assert.equal(
        await page
          .locator(".data-stream")
          .evaluate((el) => getComputedStyle(el).animationName),
        "none",
      );
      await page.getByRole("button", { name: "播放背景動態" }).click();
      assert.notEqual(
        await page
          .locator(".data-stream")
          .evaluate((el) => getComputedStyle(el).animationName),
        "none",
      );
    },
  );
  await check(
    "Zoom-equivalent viewport reflow and visible keyboard focus",
    async () => {
      await page.setViewportSize({ width: 720, height: 500 });
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      await save("zoom-equivalent-reflow.png");
      await page.reload({ waitUntil: "networkidle" });
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.locator('.sidebar nav a[href="#spot"]').focus();
      assert.equal(
        await page.evaluate(
          () => getComputedStyle(document.activeElement).outlineStyle,
        ),
        "solid",
      );
      await save("keyboard-focus.png");
      await page.emulateMedia({ forcedColors: "active" });
      assert.equal(
        await page.evaluate(
          () => getComputedStyle(document.activeElement).outlineStyle,
        ),
        "solid",
      );
      await page.emulateMedia({ forcedColors: "none" });
    },
  );
  await check(
    "Measured rendered contrast for solid foreground/background pairs",
    async () => {
      result.contrast = await page.evaluate(() => {
        const values = [
          ["Body", ".system-line > span:first-child", ".panel"],
          ["Muted metadata", ".mini-watch small", ".panel"],
          ["Positive change", ".mini-watch .positive", ".watch-panel"],
          ["Primary action", ".button.primary", ".button.primary"],
          ["Focus", ":focus-visible", ".sidebar"],
        ];
        const parse = (s) =>
          s
            .match(/[\d.]+/g)
            ?.slice(0, 3)
            .map(Number);
        const lum = (c) =>
          c
            .map((v) => v / 255)
            .map((v) =>
              v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4,
            )
            .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
        return values.map(([role, fg, bg]) => {
          const f = getComputedStyle(document.querySelector(fg));
          const b = getComputedStyle(document.querySelector(bg));
          const foreground = role === "Focus" ? f.outlineColor : f.color;
          const background = b.backgroundColor;
          const a = lum(parse(foreground)),
            z = lum(parse(background));
          return {
            role,
            foreground,
            background,
            ratio: (Math.max(a, z) + 0.05) / (Math.min(a, z) + 0.05),
            note: bg.includes("selected")
              ? "Solid base only; gradient pair excluded from claim"
              : "Opaque solid pair",
          };
        });
      });
      assert.ok(
        result.contrast
          .filter((x) => x.note === "Opaque solid pair")
          .every((x) => x.ratio >= 4.5),
      );
    },
  );
  await check(
    "No unexpected console errors, resource failures or third-party page requests",
    async () => {
      assert.deepEqual(result.consoleErrors, []);
      assert.deepEqual(result.failedResources, []);
      assert.ok(
        result.externalRequests.every(
          (url) => url === "https://backend.example.test/v1/snapshot",
        ),
      );
    },
  );
  result.completedAt = new Date().toISOString();
  result.status = "passed";
} catch (error) {
  result.status = "failed";
  result.failure = String(error.stack ?? error);
  console.error(error);
  process.exitCode = 1;
  try {
    await save("failure.png", true);
  } catch {}
} finally {
  await writeFile(
    path.join(artifacts, "browser-results.json"),
    JSON.stringify(result, null, 2),
  );
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
}
