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
});
