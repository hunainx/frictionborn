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

  test("the pause button stops the hero background only: wheel scrolling still works under SmoothScroll", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name.includes("mobile"), "SmoothScroll is off on coarse pointers");
    await page.addInitScript(() => {
      (window as any).__draws = 0;
      for (const name of ["drawArrays", "drawElements"] as const) {
        const orig = WebGL2RenderingContext.prototype[name] as (...a: unknown[]) => unknown;
        (WebGL2RenderingContext.prototype as any)[name] = function (...a: unknown[]) {
          (window as any).__draws++;
          return orig.apply(this, a);
        };
      }
    });
    await page.goto("/hero-smooth?tier=3");
    await page.waitForSelector("[data-frictionborn-item='ambient-hero']");
    await page.waitForTimeout(1500);
    const draws = () => page.evaluate(() => (window as any).__draws as number);
    const hadGl = (await draws()) > 5; // headless Firefox in CI has no WebGL2: still check the scrolling half
    // sanity: SmoothScroll is really on (it adds the lenis class) and wheel scrolling works before the pause
    await expect(page.locator("html")).toHaveClass(/lenis/);
    await page.mouse.move(600, 400);
    await page.mouse.wheel(0, 500);
    await expect.poll(() => page.evaluate(() => window.scrollY), { message: "wheel scrolling does not work even before the pause" }).toBeGreaterThan(100);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);

    const pauseBtn = page.locator("header[data-frictionborn-item='ambient-hero'] button[aria-pressed]");
    await pauseBtn.click();
    await expect(pauseBtn).toHaveAttribute("aria-pressed", "true");
    if (hadGl) {
      const a = await draws();
      await page.waitForTimeout(600);
      expect((await draws()) - a, "the hero background must stop drawing while paused").toBeLessThan(3);
    }
    await page.mouse.move(600, 400);
    await page.mouse.wheel(0, 500);
    await expect.poll(() => page.evaluate(() => window.scrollY), { message: "wheel scrolling froze after pressing Pause (the button must not stop the page's shared frame loop)" }).toBeGreaterThan(100);
  });

  test("interactive elements are keyboard reachable in order: pause button, primary CTA, secondary CTA", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name.startsWith("webkit"), "Safari/WebKit does not Tab to links without the Option-Tab setting (verified: fails on webkit-desktop and webkit-mobile)");
    await page.goto(`/items/ambient-hero`);
    await page.waitForSelector("[data-frictionborn-item='ambient-hero']");
    // The first Tab stop on the harness page is the harness' own header link, so start from the hero's first control.
    const pause = page.locator("header[data-frictionborn-item='ambient-hero'] button[aria-pressed]");
    await pause.focus();
    const active = () => page.evaluate(() => { const e = document.activeElement as HTMLElement; return `${e.tagName.toLowerCase()}:${(e.getAttribute("aria-label") || e.textContent || "").trim()}`; });
    expect(await active()).toMatch(/^button:Pause ambient background motion/);
    await page.keyboard.press("Tab");
    expect(await active()).toBe("a:Browse components");
    await page.keyboard.press("Tab");
    expect(await active()).toBe("a:Read how it is tested");
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
