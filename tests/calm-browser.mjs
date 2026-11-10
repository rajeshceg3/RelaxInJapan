import { createServer } from "node:http";
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { chromium } from "playwright";
const out = process.env.OUT || "docs/calm-experience/local";
fs.mkdirSync(out, { recursive: true });
const server = createServer((q, r) => {
  try {
    let f = path.join(
      process.cwd(),
      q.url.split("?")[0] === "/" ? "index.html" : q.url.split("?")[0],
    );
    r.setHeader(
      "content-type",
      f.endsWith(".js")
        ? "text/javascript"
        : f.endsWith(".css")
          ? "text/css"
          : f.endsWith(".svg")
            ? "image/svg+xml"
            : "text/html",
    );
    r.end(fs.readFileSync(f));
  } catch {
    r.writeHead(404);
    r.end();
  }
});
await new Promise((r) => server.listen(4211, r));
const b = await chromium.launch({
  executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome",
  args: ["--no-sandbox"],
});
let results = [];
try {
  for (const [w, h] of [
    [320, 700],
    [390, 844],
    [844, 390],
    [1320, 900],
  ]) {
    const p = await b.newPage({
      viewport: { width: w, height: h },
      reducedMotion: "reduce",
    });
    const errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto(process.env.DIRECT_URL || "http://localhost:4211/", {
      waitUntil: "networkidle",
    });
    assert.equal(
      await p.locator("body").getAttribute("data-calm-view"),
      "home",
    );
    assert(!(await p.locator("#theme-customization-panel").isVisible()));
    assert(!(await p.locator("#gallery-controls").isVisible()));
    assert(!(await p.locator("#journaling-widget").isVisible()));
    await p.screenshot({ path: `${out}/home-${w}.png` });
    await p.locator("#calm-begin").click();
    assert(await p.locator("#meditation-timer-widget").isVisible());
    await p.screenshot({ path: `${out}/timer-${w}.png` });
    await p.locator("#meditation-play-btn").click();
    assert(await p.locator("#meditation-pause-btn").isVisible());
    await p.locator("a.journal-jump").click();
    assert(await p.locator("#journaling-widget").isVisible());
    assert(!(await p.locator("#meditation-timer-widget").isVisible()));
    await p.screenshot({ path: `${out}/journal-${w}.png` });
    await p.locator("a.links-jump").click();
    assert(await p.locator("#quick-links-panel").isVisible());
    await p.locator("#add-link-btn").click();
    assert(await p.locator("#quick-link-modal").isVisible());
    for (let i = 0; i < 10; i++) {
      await p.keyboard.press("Tab");
      assert(
        await p.evaluate(() =>
          Boolean(document.activeElement.closest(".modal-content")),
        ),
      );
    }
    await p.keyboard.press("Escape");
    assert(!(await p.locator("#quick-link-modal").isVisible()));
    await p.locator("#calm-space").click();
    assert(await p.locator("#space-settings").isVisible());
    assert(!(await p.locator("#theme-customization-panel").isVisible()));
    await p.locator(".space-disclosure summary").first().click();
    assert(await p.locator("#theme-customization-panel").isVisible());
    await p.screenshot({ path: `${out}/space-${w}.png` });
    await p.locator("#calm-home").click();
    assert.equal(
      await p.locator("body").getAttribute("data-calm-view"),
      "home",
    );
    await p.locator("#calm-write").click();
    assert.equal(
      await p.evaluate(() => document.activeElement.id),
      "journal-text-input",
    );
    assert.equal(
      await p.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    assert.deepEqual(errors, []);
    results.push({ width: w, height: h, passed: true, errors });
    await p.close();
    console.log("PASS", w);
  }
} finally {
  await b.close();
  server.close();
  fs.writeFileSync(`${out}/results.json`, JSON.stringify(results, null, 2));
}
