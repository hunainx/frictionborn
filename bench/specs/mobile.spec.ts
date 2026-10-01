// Original — Frictionborn Motion mobile viewport spec
import { test, expect } from "@playwright/test";

const item = process.env.BENCH_ITEM || "noise-field";

test.describe("Mobile spec", () => {
  test("renders properly on mobile viewport without horizontal overflow", async ({ page }) => {
    await page.goto(`/items/${item}`);
    await page.waitForSelector(`[data-frictionborn-item='${item}']`);

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

    // No horizontal overflow
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });
});
