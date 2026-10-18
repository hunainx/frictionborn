// Original — Frictionborn Motion universal `paused` prop spec (docs/API-CONVENTIONS.md §1: "When true, freezes frame advancement").
// Real browser, real requestAnimationFrame: a paused item must request ZERO frames (and no running CSS animation) while it is
// being used, and must resume when `paused` flips back. The running control proves the measurement can see frames at all.
import { test, expect, type Page } from "@playwright/test";

const item = process.env.BENCH_ITEM ?? "";

// What "being used" means for each item, so the running control actually produces frames.
const GL_ITEMS = ["noise-field", "particle-field", "mesh-gradient", "ambient-hero", "ember-core"];
// Items that, when running, must produce rAF frames in this exercise. The others animate with CSS or run no loop of their own.
const FRAME_ITEMS = [...GL_ITEMS, "smooth-scroll", "magnetic-button", "distortion-image"];

async function exercise(page: Page) {
  const subject = page.locator("[data-testid='subject']");
  if (item === "smooth-scroll") {
    await page.mouse.move(400, 400);
    for (let i = 0; i < 4; i++) {
      await page.mouse.wheel(0, 300);
      await page.waitForTimeout(120);
    }
  } else if (item === "magnetic-button" || item === "distortion-image") {
    const box = await subject.boundingBox();
    if (!box) throw new Error("subject not visible");
    for (let i = 0; i < 12; i++) {
      await page.mouse.move(box.x + 10 + i * 6, box.y + 10 + i * 3);
      await page.waitForTimeout(40);
    }
  } else {
    await page.waitForTimeout(1500);
  }
  await page.waitForTimeout(400);
}

async function frames(page: Page, run: () => Promise<void>) {
  await page.evaluate(() => ((window as any).__rafCalls = 0));
  await run();
  return page.evaluate(() => (window as any).__rafCalls as number);
}

test.describe("paused prop", () => {
  test.skip(!item || item === "dummy", "needs BENCH_ITEM");

  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "frame counting is done once, on Chromium desktop (software GL)");
    await page.addInitScript(() => {
      (window as any).__rafCalls = 0;
      const raf = window.requestAnimationFrame.bind(window);
      window.requestAnimationFrame = (cb: FrameRequestCallback) =>
        raf((t) => {
          (window as any).__rafCalls++;
          cb(t);
        });
    });
  });

  test("paused item requests no frames while used, and resumes when un-paused", async ({ page }) => {
    await page.goto(`/paused-cases?item=${item}&paused=1&tier=3`);
    await page.waitForSelector("[data-testid='case-root'] *");
    await page.waitForTimeout(700);

    // 1. paused: zero frames while the item is exercised
    const pausedFrames = await frames(page, () => exercise(page));
    expect(pausedFrames, `${item} requested animation frames while paused`).toBe(0);
    if (item === "marquee") {
      const states = await page.evaluate(() => document.getAnimations().map((a) => a.playState));
      expect(states.length).toBeGreaterThan(0);
      expect(states.every((s) => s === "paused"), `marquee animations while paused: ${states}`).toBe(true);
    }
    if (GL_ITEMS.includes(item) || item === "distortion-image") {
      // No frames is not enough: the GL work itself must have stopped (no draw calls) and no lease is held for a paused item.
      const leases = await page.evaluate(() => (window as any).__FB_PROBES__?.contextCounter?.getStats?.().activeContexts ?? 0);
      expect(leases).toBeLessThanOrEqual(GL_ITEMS.includes(item) ? 1 : 0);
    }

    // 2. resume: the control. It must see frames, or the 0 above proves nothing.
    await page.locator("[data-testid='toggle-paused']").click();
    await expect(page.locator("[data-testid='paused-state']")).toHaveText("running");
    const runningFrames = await frames(page, () => exercise(page));
    if (FRAME_ITEMS.includes(item)) {
      expect(runningFrames, `${item} did not request frames after being un-paused (the control is vacuous or resume is broken)`).toBeGreaterThan(5);
    }
    if (item === "marquee") {
      const states = await page.evaluate(() => document.getAnimations().map((a) => a.playState));
      expect(states.some((s) => s === "running"), `marquee animations after resume: ${states}`).toBe(true);
    }

    // 3. pause again: frames stop again
    await page.locator("[data-testid='toggle-paused']").click();
    await expect(page.locator("[data-testid='paused-state']")).toHaveText("paused");
    await page.waitForTimeout(500);
    const pausedAgain = await frames(page, () => exercise(page));
    expect(pausedAgain, `${item} kept requesting frames after being paused again`).toBeLessThanOrEqual(2);
  });
});
