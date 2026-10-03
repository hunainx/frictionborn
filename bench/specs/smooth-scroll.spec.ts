// Original — Frictionborn Motion SmoothScroll functional spec (wheel, keyboard, anchors, nested scroll, idle)
import { test, expect } from "@playwright/test";

const item = process.env.BENCH_ITEM || "noise-field";

// Resolve once scrollY has stopped changing for 600 ms; returns the final position (so failures show the number)
async function settledScrollY(page: import("@playwright/test").Page, timeout = 8000): Promise<number> {
  const start = Date.now();
  let last = -1;
  let stableSince = Date.now();
  while (Date.now() - start < timeout) {
    const y = await page.evaluate(() => window.scrollY);
    if (Math.abs(y - last) > 0.5) {
      last = y;
      stableSince = Date.now();
    } else if (Date.now() - stableSince >= 600) {
      return y;
    }
    await page.waitForTimeout(100);
  }
  return last;
}

test.describe("SmoothScroll functional behaviour", () => {
  test.skip(item !== "smooth-scroll", "SmoothScroll only");

  test.beforeEach(async ({ page, isMobile }) => {
    test.skip(isMobile === true, "coarse pointer: SmoothScroll is off by design, native scroll");
    await page.goto(`/items/${item}`);
    await page.waitForSelector("[data-frictionborn-item='smooth-scroll'][data-active='true']");
    // Guarantee a tall page and a nested scroller regardless of demo content
    await page.evaluate(() => {
      const tall = document.createElement("div");
      tall.id = "audit-tall";
      tall.style.cssText = "height:6000px;position:relative";
      tall.innerHTML =
        '<a id="audit-anchor" href="#audit-target" style="position:absolute;top:10px;left:10px">to target</a>' +
        '<div id="audit-target" style="position:absolute;top:3000px">target</div>' +
        '<div id="audit-nested" style="position:absolute;top:200px;left:10px;width:300px;height:150px;overflow:auto;border:1px solid"><div style="height:2000px">nested</div></div>';
      document.body.appendChild(tall);
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(300);
  });

  test("mouse wheel scrolls, eases (not instant) and lands on the target", async ({ page }) => {
    await page.mouse.move(700, 500);
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(100);
    const early = await page.evaluate(() => Math.round(window.scrollY));
    expect(early).toBeLessThan(500); // eased, not a jump
    expect(Math.abs((await settledScrollY(page)) - 500)).toBeLessThanOrEqual(3);
  });

  test("zero rAF frames once scrolling has settled", async ({ page }) => {
    await page.mouse.move(700, 500);
    await page.mouse.wheel(0, 400);
    expect(Math.abs((await settledScrollY(page)) - 400)).toBeLessThanOrEqual(3);
    await page.waitForTimeout(800);
    await page.evaluate(() => window.__FB_PROBES__?.frameCounter.reset());
    await page.waitForTimeout(1000);
    const frames = await page.evaluate(() => window.__FB_PROBES__?.frameCounter.getStats().totalFrames ?? -1);
    expect(frames).toBeLessThanOrEqual(2);
  });

  test("keyboard scrolling stays native (PageDown, End, Home)", async ({ page }) => {
    await page.evaluate(() => (document.body as HTMLElement).focus());
    await page.keyboard.press("PageDown");
    await page.waitForFunction(() => window.scrollY > 100, undefined, { timeout: 4000 });
    await page.keyboard.press("End");
    await page.waitForFunction(() => window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4, undefined, { timeout: 4000 });
    await page.keyboard.press("Home");
    await page.waitForFunction(() => window.scrollY === 0, undefined, { timeout: 4000 });
  });

  test("anchor links still jump to their target", async ({ page }) => {
    await page.locator("#audit-anchor").scrollIntoViewIfNeeded();
    await page.click("#audit-anchor");
    await page.waitForFunction(() => Math.abs(document.getElementById("audit-target")!.getBoundingClientRect().top) <= 4, undefined, { timeout: 4000 });
  });

  test("nested scroll areas keep their own wheel scrolling", async ({ page }) => {
    await page.evaluate(() => document.getElementById("audit-nested")!.scrollIntoView({ block: "center" }));
    await page.waitForTimeout(500);
    const box = await page.locator("#audit-nested").boundingBox();
    await page.mouse.move(box!.x + 50, box!.y + 50);
    const before = await page.evaluate(() => window.scrollY);
    await page.mouse.wheel(0, 200);
    await page.waitForTimeout(800);
    const nested = await page.evaluate(() => document.getElementById("audit-nested")!.scrollTop);
    expect(nested).toBeGreaterThan(50);
    expect(await page.evaluate(() => window.scrollY)).toBe(before);
  });
});
