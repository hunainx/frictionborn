// Original — Frictionborn Motion DistortionImage 30-image stress, lease, and leak spec
import { test, expect } from "@playwright/test";

test.describe("DistortionImage Stress, Budget, and Leak DoD", () => {
  test("strictly enforces glBudget ceiling <= 4 on desktop (fine) and <= 2 on mobile (coarse) across 30 images", async ({
    page,
  }) => {
    await page.goto("/stress-distortion?tier=3");
    await page.waitForSelector("[data-testid='stress-distortion-container']");
    await page.waitForTimeout(1000);

    // Verify all 30 images mounted in the DOM
    const itemCount = await page.locator("[data-frictionborn-item='distortion-image']").count();
    expect(itemCount).toBe(30);

    // Verify all 30 images have real <img> tags defining layout (0 CLS)
    const imgCount = await page.locator("[data-frictionborn-item='distortion-image'] img").count();
    expect(imgCount).toBe(30);

    const isFine = await page.evaluate(() => window.matchMedia("(pointer: fine)").matches);
    const maxCeiling = isFine ? 4 : 2;

    // Hover across the first 6 items to request multiple leases
    if (isFine) {
      for (let i = 1; i <= 6; i++) {
        const item = page.locator(`[data-testid='stress-item-${i}']`);
        await item.scrollIntoViewIfNeeded();
        await item.hover();
        await page.waitForTimeout(100);
      }
    }

    const stats = await page.evaluate(() => {
      const p = window.__FB_PROBES__;
      return {
        contextStats: p?.contextCounter.getStats(),
        activeContexts: p?.contextCounter.getStats()?.activeContexts ?? 0,
        unplannedLosses: p?.contextCounter.getStats()?.unplannedLosses ?? 0,
      };
    });

    expect(stats.unplannedLosses).toBe(0);
    expect(stats.activeContexts).toBeLessThanOrEqual(maxCeiling);
  });

  test("releases lease after 3 seconds of idle when pointer leaves element", async ({ page }) => {
    const isFine = await page.evaluate(() => window.matchMedia("(pointer: fine)").matches);
    if (!isFine) return; // Touch pointers don't acquire hover leases

    await page.goto("/stress-distortion?tier=3");
    await page.waitForSelector("[data-testid='stress-distortion-container']");
    await page.waitForTimeout(500);

    const firstItem = page.locator("[data-testid='stress-item-1']");
    await firstItem.scrollIntoViewIfNeeded();

    // Hover to trigger lease acquisition
    await firstItem.hover();

    // Verify a WebGL canvas overlay is rendered while hovering (waiting for React.lazy chunk load)
    const canvas = firstItem.locator("canvas");
    await canvas.waitFor({ state: "attached", timeout: 8000 });
    expect(await canvas.count()).toBe(1);

    // Move mouse away to header
    await page.locator("[data-testid='stress-distortion-container'] header").hover();

    // Within the 3s grace period, canvas might still linger
    await page.waitForTimeout(500);

    // Wait past the 3s idle release timer (3.5s total)
    await page.waitForTimeout(3200);

    // The lease must be released and canvas overlay unmounted
    await canvas.waitFor({ state: "detached", timeout: 5000 });
    expect(await canvas.count()).toBe(0);
  });

  test("50 mount/unmount cycles leave 0 leaked contexts and 0 leaked textures", async ({
    page,
  }, testInfo) => {
    // 50 cycles on desktop projects, 25 on mobile/fallbacks per Decision 23
    const isFullSpec = ["chromium-desktop", "webkit-desktop"].includes(testInfo.project.name);
    const cycles = isFullSpec ? 50 : 25;
    test.setTimeout(90_000);

    await page.goto(`/stress-distortion?leak=1&tier=3&cycles=${cycles}`);
    await page.waitForSelector("[data-leak-done='true']", { timeout: 60_000 });
    await page.waitForTimeout(500);

    const stats = await page.evaluate(() => {
      const p = window.__FB_PROBES__;
      return {
        contextStats: p?.contextCounter.getStats(),
        activeContexts: p?.contextCounter.getStats()?.activeContexts ?? 0,
        unplannedLosses: p?.contextCounter.getStats()?.unplannedLosses ?? 0,
        activeTextures: p?.textureCounter?.getStats()?.activeTextures ?? 0,
      };
    });

    expect(stats.activeContexts).toBe(0);
    expect(stats.activeTextures).toBe(0);
    expect(stats.unplannedLosses).toBe(0);
  });

  test("100 hover-in/out cycles across images leave 0 leaked contexts and 0 leaked textures", async ({
    page,
  }) => {
    const isFine = await page.evaluate(() => window.matchMedia("(pointer: fine)").matches);
    if (!isFine) return; // Touch pointers don't acquire hover leases

    test.setTimeout(90_000);
    await page.goto("/stress-distortion?tier=3");
    await page.waitForSelector("[data-testid='stress-distortion-container']");
    await page.waitForTimeout(500);

    // Perform 100 real pointer hover cycles across items 1 to 4 (25 rounds x 4 items)
    const items = [1, 2, 3, 4].map((i) => page.locator(`[data-testid='stress-item-${i}']`));
    for (let round = 0; round < 25; round++) {
      for (const item of items) {
        await item.hover();
      }
    }

    // Move pointer away to container header so all items are left
    await page.locator("[data-testid='stress-distortion-container'] header").hover();

    // Wait past 3s idle release timeout so all temporary leases release cleanly
    await page.waitForTimeout(3500);

    const stats = await page.evaluate(() => {
      const p = window.__FB_PROBES__;
      return {
        activeContexts: p?.contextCounter.getStats()?.activeContexts ?? 0,
        activeTextures: p?.textureCounter?.getStats()?.activeTextures ?? 0,
        unplannedLosses: p?.contextCounter.getStats()?.unplannedLosses ?? 0,
      };
    });

    expect(stats.unplannedLosses).toBe(0);
    expect(stats.activeContexts).toBe(0);
    expect(stats.activeTextures).toBe(0);
  });
});
