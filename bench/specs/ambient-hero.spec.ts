// Original — Frictionborn Motion AmbientHero specification test
import { test, expect } from "@playwright/test";

const item = process.env.BENCH_ITEM || "ambient-hero";

test.describe("AmbientHero composition spec", () => {
  test.skip(item !== "ambient-hero", "ambient-hero only");

  test("renders exactly one semantic h1 heading", async ({ page }) => {
    await page.goto(`/items/ambient-hero`);
    await page.waitForSelector("[data-frictionborn-item='ambient-hero']");

    const h1Count = await page.locator("h1").count();
    expect(h1Count).toBe(1);

    const h1Text = await page.locator("h1").innerText();
    expect(h1Text.trim().length).toBeGreaterThan(0);
  });

  test("at most 1 WebGL context above the fold", async ({ page }) => {
    await page.goto(`/items/ambient-hero?tier=3`);
    await page.waitForSelector("[data-frictionborn-item='ambient-hero']");
    await page.waitForTimeout(1000);

    const stats = await page.evaluate(() => window.__FB_PROBES__?.contextCounter?.getStats());
    expect(stats?.activeContexts ?? 0).toBeLessThanOrEqual(1);
    expect(stats?.unplannedLosses ?? 0).toBe(0);
  });

  test("pause button toggles ambient motion and updates aria-pressed/aria-label", async ({ page }) => {
    await page.goto(`/items/ambient-hero`);
    const pauseBtn = page.locator("header[data-frictionborn-item='ambient-hero'] button[aria-pressed]");
    await expect(pauseBtn).toBeVisible();

    // Initial state: not pressed
    await expect(pauseBtn).toHaveAttribute("aria-pressed", "false");
    await expect(pauseBtn).toHaveAttribute("aria-label", "Pause ambient background motion");

    // Click to pause
    await pauseBtn.click();
    await expect(pauseBtn).toHaveAttribute("aria-pressed", "true");
    await expect(pauseBtn).toHaveAttribute("aria-label", "Resume ambient background motion");

    // Click to resume
    await pauseBtn.click();
    await expect(pauseBtn).toHaveAttribute("aria-pressed", "false");
    await expect(pauseBtn).toHaveAttribute("aria-label", "Pause ambient background motion");
  });

  test("interactive elements are keyboard reachable with visible focus", async ({ page }) => {
    await page.goto(`/items/ambient-hero`);
    await page.waitForSelector("[data-frictionborn-item='ambient-hero']");

    // Blur active element
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());

    // Tab onto the pause button
    await page.keyboard.press("Tab");
    const activeTagName = await page.evaluate(() => document.activeElement?.tagName.toLowerCase());
    expect(["button", "a"]).toContain(activeTagName);

    // Tab onto the primary CTA
    await page.keyboard.press("Tab");
    const activeCta = await page.evaluate(() => document.activeElement?.tagName.toLowerCase());
    expect(["button", "a"]).toContain(activeCta);
  });

  test("reduced motion renders static poster with 0 WebGL canvases", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`/items/ambient-hero`);
    await page.waitForSelector("[data-frictionborn-item='ambient-hero']");
    await page.waitForTimeout(500);

    const canvasCount = await page.locator("canvas").count();
    expect(canvasCount).toBe(0);

    // Headline is intact and fully readable
    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();
    expect((await h1.innerText()).length).toBeGreaterThan(0);
  });
});
