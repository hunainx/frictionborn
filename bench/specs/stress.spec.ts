// Original — Frictionborn Motion tier and stress spec
import { test, expect } from "@playwright/test";

test.describe("Tier override and stress spec", () => {
  for (const tier of ["0", "1", "2", "3"]) {
    test(`correctly mounts with forced tier ${tier}`, async ({ page }) => {
      await page.goto(`/items/dummy?tier=${tier}`);
      await page.waitForSelector("[data-frictionborn-item='dummy']");

      // Wait for client tier attribute update
      await page.waitForFunction(
        (expected) => document.documentElement.getAttribute("data-fb-tier") === expected,
        tier
      );

      const currentTier = await page.evaluate(() =>
        document.documentElement.getAttribute("data-fb-tier")
      );
      expect(currentTier).toBe(tier);
    });
  }
});
