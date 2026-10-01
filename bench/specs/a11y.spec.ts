// Original — Frictionborn Motion accessibility spec
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { recordMeasurement } from "../record-measurement.ts";

const item = process.env.BENCH_ITEM || "noise-field";

test.describe("Accessibility spec", () => {
  test("satisfies WCAG requirements with 0 serious and 0 critical violations", async ({ page }) => {
    await page.goto(`/items/${item}`);
    await page.waitForSelector(`[data-frictionborn-item='${item}']`);
    await page.waitForTimeout(1000);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .include("#demo-mount-point")
      .analyze();

    const seriousViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === "serious"
    );
    const criticalViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === "critical"
    );

    recordMeasurement(item, {
      axe: {
        serious: seriousViolations.length,
        critical: criticalViolations.length,
      },
    });

    expect(seriousViolations).toHaveLength(0);
    expect(criticalViolations).toHaveLength(0);

    // Text stays in DOM
    const textContent = await page.locator(`[data-frictionborn-item='${item}']`).first().innerText();
    expect(textContent.length).toBeGreaterThan(0);
  });
});
