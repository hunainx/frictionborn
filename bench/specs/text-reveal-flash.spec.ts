// Original — Frictionborn Motion TextReveal continuous visibility spec
import { test, expect } from "@playwright/test";

test.describe("TextReveal SSR continuous visibility spec (N8)", () => {
  test("headline never vanishes during SSR hydration (sampled every 16ms)", async ({ page }) => {
    // Inject continuous sampling script before page scripts run
    await page.addInitScript(() => {
      (window as any).__visibilitySamples = [];
      const interval = setInterval(() => {
        const el = document.querySelector('[data-frictionborn-item="text-reveal"]');
        if (el) {
          const style = window.getComputedStyle(el);
          const opacity = parseFloat(style.opacity || "1");
          const rect = el.getBoundingClientRect();
          const visible = style.visibility !== "hidden" && style.display !== "none" && rect.height > 0;
          (window as any).__visibilitySamples.push({
            time: performance.now(),
            opacity,
            visible,
            text: el.textContent?.trim() || "",
          });
        }
      }, 16);
      window.addEventListener("load", () => {
        setTimeout(() => clearInterval(interval), 1500);
      });
    });

    await page.goto("/items/text-reveal");
    await page.waitForTimeout(1000);

    const samples: Array<{ time: number; opacity: number; visible: boolean; text: string }> = await page.evaluate(
      () => (window as any).__visibilitySamples || []
    );

    // We must have recorded samples
    expect(samples.length).toBeGreaterThan(10);

    // At EVERY sample, the headline must be visible and opacity must NOT be 0
    for (const sample of samples) {
      expect(sample.visible).toBe(true);
      expect(sample.opacity).toBeGreaterThanOrEqual(0.5);
      expect(sample.text.length).toBeGreaterThan(0);
    }
  });
});
