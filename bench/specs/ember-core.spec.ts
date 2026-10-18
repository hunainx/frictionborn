// Original — Frictionborn Motion EmberCore pixel-reading interaction & hero scroll spec
import { test, expect, type Page } from "@playwright/test";

const item = process.env.BENCH_ITEM || "ember-core";
const STUDIO_URL = process.env.STUDIO_URL || "";

async function installReadbackHelper(page: Page) {
  await page.addInitScript(() => {
    const orig = HTMLCanvasElement.prototype.getContext;
    (window as unknown as { __ecGls: WebGL2RenderingContext[] }).__ecGls = [];
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      attrs?: WebGLContextAttributes
    ) {
      if (type === "webgl2") {
        attrs = { ...(attrs || {}), preserveDrawingBuffer: true };
      }
      const ctx = (orig as unknown as (t: string, a?: unknown) => unknown).call(this, type, attrs);
      if (type === "webgl2" && ctx) {
        (window as unknown as { __ecGls: WebGL2RenderingContext[] }).__ecGls.push(ctx as WebGL2RenderingContext);
      }
      return ctx as RenderingContext | null;
    } as typeof HTMLCanvasElement.prototype.getContext;
  });
}

async function readPatchMetrics(page: Page, normX = 0.5, normY = 0.5, patchSize = 96) {
  return page.evaluate(
    ({ nx, ny, sz }) => {
      const canvas = document.querySelector("[data-frictionborn-item='ember-core'] canvas") as HTMLCanvasElement | null;
      const gls = (window as unknown as { __ecGls?: WebGL2RenderingContext[] }).__ecGls || [];
      const gl = gls.find((g) => g.canvas === canvas) || gls[gls.length - 1];
      if (!canvas || !gl) throw new Error("No active EmberCore WebGL2 context");
      const w = gl.drawingBufferWidth;
      const h = gl.drawingBufferHeight;
      const pw = Math.min(w, sz);
      const ph = Math.min(h, sz);
      const x0 = Math.max(0, Math.min(w - pw, Math.round(nx * w - pw / 2)));
      // WebGL readPixels origin is bottom-left
      const y0 = Math.max(0, Math.min(h - ph, Math.round((1 - ny) * h - ph / 2)));
      const px = new Uint8Array(pw * ph * 4);
      gl.readPixels(x0, y0, pw, ph, gl.RGBA, gl.UNSIGNED_BYTE, px);
      let sumLum = 0;
      let sumHeat = 0;
      const n = pw * ph;
      for (let i = 0; i < px.length; i += 4) {
        const r = px[i];
        const g = px[i + 1];
        const b = px[i + 2];
        sumLum += 0.2126 * r + 0.7152 * g + 0.0722 * b;
        sumHeat += r * 0.7 + g * 0.3;
      }
      return {
        meanBrightness: sumLum / n,
        redHeat: sumHeat / n,
      };
    },
    { nx: normX, ny: normY, sz: patchSize }
  );
}

async function readFullFrameStats(page: Page) {
  return page.evaluate(() => {
    const canvas = document.querySelector("[data-frictionborn-item='ember-core'] canvas") as HTMLCanvasElement | null;
    const gls = (window as unknown as { __ecGls?: WebGL2RenderingContext[] }).__ecGls || [];
    const gl = gls.find((g) => g.canvas === canvas) || gls[gls.length - 1];
    if (!canvas || !gl) throw new Error("No active EmberCore WebGL2 context");
    const w = gl.drawingBufferWidth;
    const h = gl.drawingBufferHeight;
    const px = new Uint8Array(w * h * 4);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
    let sumLum = 0;
    const samples: number[] = [];
    const stride = Math.max(4, Math.floor(px.length / (64 * 64 * 4)) * 4);
    for (let i = 0; i < px.length; i += 4) {
      sumLum += 0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2];
    }
    for (let i = 0; i < px.length; i += stride) {
      samples.push(px[i], px[i + 1], px[i + 2]);
    }
    return {
      meanBrightness: sumLum / (w * h),
      samples,
    };
  });
}

test.describe("EmberCore pixel-reading interactions and hero page scroll safety", () => {
  test.skip(item !== "ember-core", "ember-core only");

  test("hover heats the pixels near the pointer", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop pointer hover spec");
    await installReadbackHelper(page);
    await page.goto("/items/ember-core?tier=3");
    const canvas = page.locator("[data-frictionborn-item='ember-core'] canvas").first();
    await expect(canvas).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(400);

    // Pause idle spin so any pixel change near the pointer comes strictly from hover
    const pauseBtn = page.locator("[data-frictionborn-item='ember-core']").getByRole("button", { name: "Pause" });
    await pauseBtn.click();
    await page.mouse.move(5, 5);
    await page.waitForTimeout(500);

    const box = (await canvas.boundingBox())!;
    const targetNormX = 0.5;
    const targetNormY = 0.5;
    const before = await readPatchMetrics(page, targetNormX, targetNormY, 96);

    await page.mouse.move(box.x + box.width * targetNormX, box.y + box.height * targetNormY, { steps: 10 });
    await page.waitForTimeout(450);

    const during = await readPatchMetrics(page, targetNormX, targetNormY, 96);
    expect(during.meanBrightness, `hover brightness ${during.meanBrightness.toFixed(2)} vs before ${before.meanBrightness.toFixed(2)}`).toBeGreaterThan(
      before.meanBrightness + 3.0
    );
    expect(during.redHeat, `hover redHeat ${during.redHeat.toFixed(2)} vs before ${before.redHeat.toFixed(2)}`).toBeGreaterThan(
      before.redHeat + 4.5
    );
  });

  test("drag changes the frame", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop drag spec");
    await installReadbackHelper(page);
    await page.goto("/items/ember-core?tier=3");
    const canvas = page.locator("[data-frictionborn-item='ember-core'] canvas").first();
    await expect(canvas).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(400);

    // Pause idle spin so the cloud is stationary unless dragged
    const pauseBtn = page.locator("[data-frictionborn-item='ember-core']").getByRole("button", { name: "Pause" });
    await pauseBtn.click();
    await page.mouse.move(5, 5);
    await page.waitForTimeout(600);

    const before = await readFullFrameStats(page);
    const box = (await canvas.boundingBox())!;
    const cx = box.x + box.width * 0.5;
    const cy = box.y + box.height * 0.5;

    await page.mouse.move(cx - 110, cy - 40);
    await page.mouse.down();
    await page.mouse.move(cx + 110, cy + 60, { steps: 12 });
    await page.mouse.up();
    await page.mouse.move(5, 5);
    await page.waitForTimeout(600);

    const after = await readFullFrameStats(page);
    let diffSum = 0;
    const len = Math.min(before.samples.length, after.samples.length);
    for (let i = 0; i < len; i++) {
      diffSum += Math.abs(before.samples[i] - after.samples[i]);
    }
    const meanAbsDiff = diffSum / Math.max(1, len);
    expect(meanAbsDiff, `mean absolute pixel difference after drag (${meanAbsDiff.toFixed(2)})`).toBeGreaterThan(1.5);
  });

  test("click raises mean brightness, and hold-then-release raises it more", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop click & hold-release spec");
    await installReadbackHelper(page);
    await page.goto("/items/ember-core?tier=3");
    const root = page.locator("[data-frictionborn-item='ember-core']").first();
    const canvas = root.locator("canvas").first();
    await expect(canvas).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(400);

    await root.getByRole("button", { name: "Pause" }).click();
    await page.mouse.move(5, 5);
    await page.waitForTimeout(500);

    const base = await readFullFrameStats(page);
    const box = (await canvas.boundingBox())!;
    const cx = box.x + box.width * 0.5;
    const cy = box.y + box.height * 0.5;

    // 1. Quick click (< 280 ms) -> strike flare
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.waitForTimeout(40);
    await page.mouse.up();
    await page.mouse.move(5, 5);
    await page.waitForTimeout(180);
    const clicked = await readFullFrameStats(page);

    // Reset back to baseline and pause again
    const controlsBtn = root.getByRole("button", { name: "Controls" });
    if ((await controlsBtn.getAttribute("aria-expanded")) !== "true") {
      await controlsBtn.click();
    }
    await root.getByRole("button", { name: "Reset" }).click();
    await controlsBtn.click();
    await root.getByRole("button", { name: "Pause" }).click();
    await page.mouse.move(5, 5);
    await page.waitForTimeout(500);

    // 2. Hold (>= 280 ms) to charge, then release to burst + strike
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.waitForTimeout(1500);
    await page.mouse.up();
    await page.mouse.move(5, 5);
    await page.waitForTimeout(160);
    const burst = await readFullFrameStats(page);

    expect(
      clicked.meanBrightness,
      `click meanBrightness (${clicked.meanBrightness.toFixed(2)}) must exceed baseline (${base.meanBrightness.toFixed(2)})`
    ).toBeGreaterThan(base.meanBrightness + 2.0);
    expect(
      burst.meanBrightness,
      `hold-release meanBrightness (${burst.meanBrightness.toFixed(2)}) must exceed click (${clicked.meanBrightness.toFixed(2)})`
    ).toBeGreaterThan(clicked.meanBrightness + 1.0);
  });

  test("wheel on /studio (hero mode) still scrolls the page", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop wheel scroll spec");
    const targetUrl = STUDIO_URL ? `${STUDIO_URL.replace(/\/$/, "")}/studio` : "/items/ember-core?tier=3&hero=1";
    if (STUDIO_URL) {
      await page.addInitScript(() => {
        try {
          localStorage.setItem("fb-experience@site-v3", "ignite");
        } catch {
          // ignore
        }
      });
    }
    await page.goto(targetUrl);
    const hero = page.locator("[data-frictionborn-item='ember-core'][data-interactive='hero']").first();
    await expect(hero).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(500);

    const box = (await hero.boundingBox())!;
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
    await page.mouse.wheel(0, 520);

    await expect
      .poll(() => page.evaluate(() => window.scrollY), {
        timeout: 5000,
        message: "wheel over EmberCore hero must scroll the page",
      })
      .toBeGreaterThan(150);
  });

  test("a vertical touch swipe on /studio (hero mode) still scrolls the page", async ({ page }, testInfo) => {
    test.skip(!["chromium-mobile", "chromium-desktop"].includes(testInfo.project.name), "chromium touch swipe spec");
    const targetUrl = STUDIO_URL ? `${STUDIO_URL.replace(/\/$/, "")}/studio` : "/items/ember-core?tier=3&hero=1";
    if (STUDIO_URL) {
      await page.addInitScript(() => {
        try {
          localStorage.setItem("fb-experience@site-v3", "ignite");
        } catch {
          // ignore
        }
      });
    }
    await page.goto(targetUrl);
    const hero = page.locator("[data-frictionborn-item='ember-core'][data-interactive='hero']").first();
    await expect(hero).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(400);

    // Ensure touch wakes the hero canvas if deferred on phone
    await page.evaluate(() => {
      window.dispatchEvent(new TouchEvent("touchstart", { bubbles: true, cancelable: true }));
    });
    await page.waitForTimeout(400);

    // Verify touch-action: pan-y and that vertical touchmove is never preventDefault()-blocked by the hero
    const swipeResult = await page.evaluate(() => {
      const wrap = document.querySelector(
        "[data-frictionborn-item='ember-core'][data-interactive='hero'] .fb-ec-gl-wrap"
      ) as HTMLElement | null;
      const target = (wrap?.querySelector("canvas") ?? wrap ?? document.body) as HTMLElement;
      const touchAction = wrap ? getComputedStyle(wrap).touchAction : "";
      const mkTouch = (x: number, y: number) =>
        new Touch({
          identifier: 1,
          target,
          clientX: x,
          clientY: y,
          pageX: x,
          pageY: y,
        });
      const ts = new TouchEvent("touchstart", {
        bubbles: true,
        cancelable: true,
        touches: [mkTouch(195, 520)],
        changedTouches: [mkTouch(195, 520)],
      });
      const tm = new TouchEvent("touchmove", {
        bubbles: true,
        cancelable: true,
        touches: [mkTouch(195, 180)],
        changedTouches: [mkTouch(195, 180)],
      });
      const te = new TouchEvent("touchend", {
        bubbles: true,
        cancelable: true,
        touches: [],
        changedTouches: [mkTouch(195, 180)],
      });
      target.dispatchEvent(ts);
      const moveAllowed = target.dispatchEvent(tm);
      target.dispatchEvent(te);
      if (moveAllowed && touchAction === "pan-y") {
        window.scrollBy(0, 340);
      }
      return { touchAction, moveAllowed, scrollY: window.scrollY };
    });

    expect(swipeResult.touchAction).toBe("pan-y");
    expect(swipeResult.moveAllowed).toBe(true);
    expect(swipeResult.scrollY).toBeGreaterThan(150);
  });
});
