// Original — Frictionborn Motion tier and stress spec
import { test, expect } from "@playwright/test";

const item = process.env.BENCH_ITEM || "noise-field";

test.describe("Tier override and stress spec", () => {
  for (const tier of ["0", "1", "2", "3"]) {
    test(`correctly mounts with forced tier ${tier}`, async ({ page }) => {
      await page.goto(`/items/${item}?tier=${tier}`);
      await page.waitForSelector(`[data-frictionborn-item='${item}']`, { state: "attached" });

      // Wait for client tier attribute update
      await page.waitForFunction(
        (expected) => document.documentElement.getAttribute("data-fb-tier") === expected,
        tier
      );

      const currentTier = await page.evaluate(() =>
        document.documentElement.getAttribute("data-fb-tier")
      );
      expect(currentTier).toBe(tier);

      // Verify the component itself reacted and set its data-tier
      const componentTier = await page.locator(`[data-frictionborn-item='${item}']`).first().getAttribute("data-tier");
      expect(componentTier).toBe(tier);
    });
  }
});
