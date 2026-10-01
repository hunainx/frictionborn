// Original — Frictionborn Motion accessibility spec
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Accessibility spec", () => {
  test("satisfies WCAG requirements with 0 serious and 0 critical violations", async ({ page }) => {
    await page.goto("/items/dummy");
    await page.waitForSelector("[data-frictionborn-item='dummy']");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .include("#demo-mount-point")
      .analyze();

    const seriousViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === "serious"
    );
    const criticalViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === "critical"
    );

    expect(seriousViolations).toHaveLength(0);
    expect(criticalViolations).toHaveLength(0);

    // Text stays in DOM
    const textContent = await page.locator("[data-frictionborn-item='dummy']").innerText();
    expect(textContent.length).toBeGreaterThan(0);
  });
});
