// Original — Frictionborn Motion multi-component GL budget stress test spec
import { test, expect } from "@playwright/test";

test.describe("Multi-Component GL Budget Stress (2x NoiseField + 2x ParticleField + 2x MeshGradient)", () => {
  test("strictly enforces glBudget ceiling <= 4 on desktop (fine) and <= 2 on mobile (coarse)", async ({
    page,
  }) => {
    await page.goto("/stress-gl");
    await page.waitForSelector("[data-testid='stress-gl-container']");
    await page.waitForTimeout(1000);

    // Verify all 6 components mounted
    const noiseCount = await page.locator("[data-frictionborn-item='noise-field']").count();
    const particleCount = await page.locator("[data-frictionborn-item='particle-field']").count();
    const meshCount = await page.locator("[data-frictionborn-item='mesh-gradient']").count();

    expect(noiseCount).toBe(2);
    expect(particleCount).toBe(2);
    expect(meshCount).toBe(2);

    // All 6 items have server-safe posters
    const posterCount = await page.locator("[data-frictionborn-poster]").count();
    expect(posterCount).toBe(6);

    const stats = await page.evaluate(() => {
      const p = window.__FB_PROBES__;
      const isFine = window.matchMedia("(pointer: fine)").matches;
      return {
        contextStats: p?.contextCounter.getStats(),
        isFine,
      };
    });

    const activeContexts = stats.contextStats?.activeContexts ?? 0;
    const unplannedLosses = stats.contextStats?.unplannedLosses ?? 0;

    expect(unplannedLosses).toBe(0);

    if (stats.isFine) {
      // Desktop fine pointer: max 4 active WebGL contexts simultaneously
      expect(activeContexts).toBeLessThanOrEqual(4);
    } else {
      // Coarse touch pointer: max 2 active WebGL contexts simultaneously
      expect(activeContexts).toBeLessThanOrEqual(2);
    }
  });

  test("leases follow visibility during scroll-through top-to-bottom and back (S8-8)", async ({
    page,
  }) => {
    // 1. Visit stacked scrolling layout. Ensure mobile runs at Tier 2 per Decision 15, desktop at Tier 3
    const isFine = await page.evaluate(() => window.matchMedia("(pointer: fine)").matches);
    const targetTier = isFine ? 3 : 2;
    const maxCeiling = isFine ? 4 : 2;

    await page.goto(`/stress-gl?scroll=1&tier=${targetTier}`);
    await page.waitForSelector("[data-layout='stacked']");
    await page.waitForTimeout(800);

    const getContextCount = async () => {
      return await page.evaluate(() => {
        return window.__FB_PROBES__?.contextCounter.getStats().activeContexts ?? 0;
      });
    };

    // Check if WebGL2 is available in this browser environment (e.g. headless Firefox on Linux CI has no WebGL2)
    const item1 = page.locator("[data-testid='gl-item-1']");
    const hasCanvas = await item1
      .locator("canvas")
      .waitFor({ state: "attached", timeout: 4000 })
      .then(() => true, () => false);

    if (!hasCanvas) {
      // In environments lacking WebGL2, verify cap is 0, posters are visible, and no crashes occurred
      const count = await getContextCount();
      expect(count).toBe(0);
      const posterCount = await page.locator("[data-frictionborn-poster]").count();
      expect(posterCount).toBe(6);
      return;
    }

    // 1. Initial position: at top
    let count = await getContextCount();
    expect(count).toBeLessThanOrEqual(maxCeiling);

    // Item 1 is in view at top and should have live canvas
    await expect(item1.locator("canvas")).toBeVisible({ timeout: 5000 });

    // 2. Scroll through: scroll down to item 3 (middle)
    const item3 = page.locator("[data-testid='gl-item-3']");
    await item3.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);

    count = await getContextCount();
    expect(count).toBeLessThanOrEqual(maxCeiling);
    await expect(item3.locator("canvas")).toBeVisible({ timeout: 5000 });

    // 3. Scroll all the way to the bottom: item 6
    const item6 = page.locator("[data-testid='gl-item-6']");
    await item6.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);

    count = await getContextCount();
    expect(count).toBeLessThanOrEqual(maxCeiling);

    // Item 6 is visible and live at the bottom
    await expect(item6.locator("canvas")).toBeVisible({ timeout: 5000 });

    // Item 1 is now far off-screen; verify it surrendered its lease
    const item1HasCanvas = await item1.locator("canvas").count();
    expect(item1HasCanvas).toBe(0);

    // 4. Scroll back to top
    await item1.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);

    count = await getContextCount();
    expect(count).toBeLessThanOrEqual(maxCeiling);

    // Item 1 re-acquired its lease and is live again
    await expect(item1.locator("canvas")).toBeVisible({ timeout: 5000 });

    // Item 6 is now off-screen and surrendered its lease
    const item6HasCanvas = await item6.locator("canvas").count();
    expect(item6HasCanvas).toBe(0);

    // Unplanned context losses must remain 0
    const unplannedLosses = await page.evaluate(
      () => window.__FB_PROBES__?.contextCounter.getStats().unplannedLosses ?? 0
    );
    expect(unplannedLosses).toBe(0);
  });
});

