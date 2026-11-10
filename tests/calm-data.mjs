import { chromium } from "playwright";
import assert from "node:assert/strict";
const b = await chromium.launch({
  executablePath: "/usr/bin/google-chrome",
  args: ["--no-sandbox"],
});
try {
  for (const layout of [
    "default",
    "traditional-grid",
    "minimalist-center",
    "asymmetrical-zen",
    "seasonal-flow",
  ]) {
    const c = await b.newContext();
    await c.addInitScript((layout) => {
      localStorage.setItem(
        "journalEntries",
        '[{"date":"2026-11-01","text":"Untouched synthetic journal","mood":null}]',
      );
      localStorage.setItem(
        "quickLinks",
        '[{"id":"keep","name":"Existing","url":"https://example.com/","icon":"x","category":"Work","extension":{"keep":true}}]',
      );
      localStorage.setItem("selectedDashboardLayout", layout);
    }, layout);
    const p = await c.newPage();
    await p.goto(process.env.DIRECT_URL || "http://localhost:4213/");
    const before = await p.evaluate(() => [
      localStorage.journalEntries,
      localStorage.quickLinks,
      localStorage.selectedDashboardLayout,
    ]);
    for (const selector of [
      "a.journal-jump",
      "a.links-jump",
      "a.timer-jump",
      "#calm-space",
      "#calm-home",
    ])
      await p.locator(selector).click();
    await p.reload();
    assert.deepEqual(
      await p.evaluate(() => [
        localStorage.journalEntries,
        localStorage.quickLinks,
        localStorage.selectedDashboardLayout,
      ]),
      before,
    );
    console.log(layout, "original bytes unchanged");
    await c.close();
  }
} finally {
  await b.close();
}
