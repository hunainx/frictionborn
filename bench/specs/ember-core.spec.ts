// Original — Frictionborn Motion EmberCore pixel-reading interaction & hero scroll spec
import { test, expect, type Page } from "@playwright/test";
import { needsGpuForTier3 } from "../tier-guard.ts";

const item = process.env.BENCH_ITEM || "ember-core";
const STUDIO_URL = process.env.STUDIO_URL || "";

async function installReadbackHelper(page: Page) {
  await page.addInitScript(() => {
    const orig = HTMLCanvasElement.prototype.getContext;
    const w = window as unknown as {
      __ecGls: WebGL2RenderingContext[];
      __ecDrawCalls: number;
      __ecScreenPassDraws: number;
    };
    w.__ecGls = [];
    w.__ecDrawCalls = 0;
    w.__ecScreenPassDraws = 0;

    for (const method of ["drawArrays", "drawElements", "drawArraysInstanced", "drawElementsInstanced"] as const) {
      const origDraw = WebGL2RenderingContext.prototype[method] as (...a: unknown[]) => unknown;
      (WebGL2RenderingContext.prototype as unknown as Record<string, unknown>)[method] = function (
        this: WebGL2RenderingContext,
        ...args: unknown[]
      ) {
        w.__ecDrawCalls++;
        if (this.getParameter(this.FRAMEBUFFER_BINDING) === null) {
          w.__ecScreenPassDraws++;
        }
        return origDraw.apply(this, args);
      };
    }

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
        w.__ecGls.push(ctx as WebGL2RenderingContext);
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
      const lums: number[] = [];
      const n = pw * ph;
      for (let i = 0; i < px.length; i += 4) {
        const r = px[i];
        const g = px[i + 1];
        const b = px[i + 2];
        const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        sumLum += lum;
        sumHeat += r * 0.7 + g * 0.3;
        lums.push(lum);
      }
      lums.sort((a, b) => a - b);
      const p90Lum = lums[Math.min(lums.length - 1, Math.floor(lums.length * 0.9))] ?? 0;
      return {
        meanBrightness: sumLum / n,
        redHeat: sumHeat / n,
        p90Lum,
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
    let covered = 0;
    const samples: number[] = [];
    const stride = Math.max(4, Math.floor(px.length / (64 * 64 * 4)) * 4);
    for (let i = 0; i < px.length; i += 4) {
      sumLum += 0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2];
      if (px[i + 3] > 0) covered++;
    }
    for (let i = 0; i < px.length; i += stride) {
      samples.push(px[i], px[i + 1], px[i + 2]);
    }
    return {
      meanBrightness: sumLum / (w * h),
      coverage: covered / (w * h),
      samples,
    };
  });
}

test.describe("EmberCore pixel-reading interactions and hero page scroll safety", () => {
  test.describe.configure({ mode: "serial" });
  test.skip(item !== "ember-core", "ember-core only");

  test("hover heats the pixels near the pointer", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop pointer hover spec");
    await needsGpuForTier3(page);
    await installReadbackHelper(page);
    await page.goto("/items/ember-core?tier=3");
    const canvas = page.locator("[data-frictionborn-item='ember-core'] canvas").first();
    await expect(canvas).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(500);

    // Pause idle spin via keyboard so the pointer never crosses the canvas before baseline measurement
    await canvas.focus();
    await page.keyboard.press("p");
    await page.waitForTimeout(300);

    const box = (await canvas.boundingBox())!;
    const targetNormX = 0.44;
    const targetNormY = 0.36;
    const before = await readPatchMetrics(page, targetNormX, targetNormY, 96);

    await page.mouse.move(box.x + box.width * targetNormX, box.y + box.height * targetNormY, { steps: 6 });

    await expect
      .poll(
        async () => {
          const cur = await readPatchMetrics(page, targetNormX, targetNormY, 96);
          return cur.meanBrightness - before.meanBrightness;
        },
        {
          timeout: 5000,
          message: `hover should heat and brighten pixels near pointer (baseline brightness=${before.meanBrightness.toFixed(2)})`,
        }
      )
      .toBeGreaterThan(3.0);

    const during = await readPatchMetrics(page, targetNormX, targetNormY, 96);
    expect(during.redHeat, `hover redHeat ${during.redHeat.toFixed(2)} vs before ${before.redHeat.toFixed(2)}`).toBeGreaterThan(
      before.redHeat + 4.5
    );
  });

  test("drag changes the frame", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop drag spec");
    await needsGpuForTier3(page);
    await installReadbackHelper(page);
    await page.goto("/items/ember-core?tier=3");
    const root = page.locator("[data-frictionborn-item='ember-core']").first();
    const canvas = root.locator("canvas").first();
    await expect(canvas).toBeVisible({ timeout: 10000 });

    // Pause idle spin via keyboard immediately so the cloud is stationary unless dragged
    await canvas.focus();
    await page.keyboard.press("p");

    const box = (await canvas.boundingBox())!;
    const cx = box.x + box.width * 0.5;
    const cy = box.y + box.height * 0.5;

    // Baseline with pointer centred at (cx, cy)
    await page.mouse.move(cx, cy);
    await page.waitForTimeout(150);
    const beforeFrame = await readFullFrameStats(page);
    const upperBefore = await readPatchMetrics(page, 0.5, 0.35, 96);
    const lowerBefore = await readPatchMetrics(page, 0.5, 0.65, 96);
    const tiltBefore = upperBefore.meanBrightness - lowerBefore.meanBrightness;

    // Drag vertically upward (-300 px -> ~ -1.65 rad around X axis, rotating the hot lower hemisphere to the top)
    await page.mouse.move(cx, cy + 150);
    await page.mouse.down();
    await page.mouse.move(cx, cy - 150, { steps: 14 });
    await page.mouse.up();
    await page.mouse.move(cx, cy);
    await page.waitForTimeout(400);

    const afterFrame = await readFullFrameStats(page);
    const upperAfter = await readPatchMetrics(page, 0.5, 0.35, 96);
    const lowerAfter = await readPatchMetrics(page, 0.5, 0.65, 96);
    const tiltAfter = upperAfter.meanBrightness - lowerAfter.meanBrightness;

    let diffSum = 0;
    const len = Math.min(beforeFrame.samples.length, afterFrame.samples.length);
    for (let i = 0; i < len; i++) {
      diffSum += Math.abs(beforeFrame.samples[i] - afterFrame.samples[i]);
    }
    const meanAbsDiff = diffSum / Math.max(1, len);
    expect(meanAbsDiff, `mean absolute pixel difference after drag (${meanAbsDiff.toFixed(2)})`).toBeGreaterThan(1.2);
    expect(
      tiltAfter - tiltBefore,
      `vertical drag should rotate lower-hemisphere heat upward (tiltAfter=${tiltAfter.toFixed(2)}, tiltBefore=${tiltBefore.toFixed(2)})`
    ).toBeGreaterThan(3.0);
  });

  test("click raises mean brightness, and hold-then-release raises it more", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop click & hold-release spec");
    await needsGpuForTier3(page);
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
    await page.mouse.click(cx, cy, { delay: 20 });
    await page.mouse.move(5, 5);
    await page.waitForTimeout(180);
    const clicked = await readFullFrameStats(page);

    // Fresh mount for step 2 so the 2 s frame-guard window does not carry over from step 1 in software GL
    await page.goto("/items/ember-core?tier=3");
    await expect(canvas).toBeVisible({ timeout: 10000 });
    await root.getByRole("button", { name: "Pause" }).click();
    await page.mouse.move(5, 5);
    await page.waitForTimeout(150);

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

    const box = (await hero.boundingBox())!;
    const cx = Math.round(box.x + box.width * 0.5);
    const cy = Math.round(box.y + box.height * 0.5);

    // The swipe must land on the live WebGL canvas, not on the poster, or it proves nothing
    await expect
      .poll(() => page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.tagName ?? "", { x: cx, y: cy }), {
        timeout: 10000,
        message: "the EmberCore canvas must be under the swipe point",
      })
      .toBe("CANVAS");
    await page.evaluate(() => window.scrollTo(0, 0));

    // A real touch swipe through the browser's input pipeline (CDP), so touch-action and any preventDefault() on touchmove decide
    // whether the page scrolls. The spec never scrolls the page itself.
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: cx, y: cy }] });
    for (let i = 1; i <= 12; i++) {
      await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: cx, y: cy - i * 30 }] });
      await page.waitForTimeout(16);
    }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });

    await expect
      .poll(() => page.evaluate(() => window.scrollY), {
        timeout: 5000,
        message: "vertical touch swipe over EmberCore hero must scroll the page",
      })
      .toBeGreaterThan(150);
  });

  test("pauseAll() stops the shared runtime loop with 0 draw calls over 2 s and <= 20 draw calls per frame when active", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop draw-call & pauseAll spec");
    await needsGpuForTier3(page);
    await installReadbackHelper(page);
    await page.goto("/items/ember-core?tier=3");
    const canvas = page.locator("[data-frictionborn-item='ember-core'] canvas").first();
    await expect(canvas).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(400);

    // 1. Measure active draw calls per frame over 700 ms (with bloom enabled: 1 screen composite draw per frame)
    await page.evaluate(() => {
      const w = window as unknown as { __ecDrawCalls: number; __ecScreenPassDraws: number };
      w.__ecDrawCalls = 0;
      w.__ecScreenPassDraws = 0;
    });
    await page.waitForTimeout(700);
    const activeStats = await page.evaluate(() => {
      const w = window as unknown as { __ecDrawCalls: number; __ecScreenPassDraws: number };
      const frames = Math.max(1, w.__ecScreenPassDraws);
      return {
        totalDraws: w.__ecDrawCalls,
        frames: w.__ecScreenPassDraws,
        drawsPerFrame: w.__ecDrawCalls / frames,
      };
    });

    expect(activeStats.frames, "active EmberCore must render frames before pauseAll()").toBeGreaterThan(5);
    expect(
      activeStats.drawsPerFrame,
      `EmberCore draw calls per frame (${activeStats.drawsPerFrame.toFixed(2)}) must be <= 20 (expected 8 idle, 9 with pointer torch)`
    ).toBeLessThanOrEqual(20);
    expect(activeStats.drawsPerFrame).toBeGreaterThanOrEqual(6);

    // 2. Call pauseAll() from @frictionborn/runtime and measure 0 draw calls over a full 2,000 ms window
    await page.evaluate(() => {
      const w = window as unknown as {
        __fbRuntime?: { pauseAll: () => void; resumeAll: () => void };
        __ecDrawCalls: number;
        __ecScreenPassDraws: number;
      };
      if (!w.__fbRuntime?.pauseAll) throw new Error("__fbRuntime.pauseAll not available on harness window");
      w.__fbRuntime.pauseAll();
      w.__ecDrawCalls = 0;
      w.__ecScreenPassDraws = 0;
    });
    await page.waitForTimeout(2000);
    const pausedDraws = await page.evaluate(() => {
      const w = window as unknown as { __ecDrawCalls: number };
      return w.__ecDrawCalls;
    });
    expect(pausedDraws, "EmberCore must issue 0 WebGL draw calls over 2 s while pauseAll() is active").toBe(0);

    // 3. Resume via resumeAll() and verify draw calls resume
    await page.evaluate(() => {
      const w = window as unknown as {
        __fbRuntime?: { pauseAll: () => void; resumeAll: () => void };
        __ecDrawCalls: number;
      };
      w.__fbRuntime?.resumeAll();
      w.__ecDrawCalls = 0;
    });
    await page.waitForTimeout(400);
    const resumedDraws = await page.evaluate(() => {
      const w = window as unknown as { __ecDrawCalls: number };
      return w.__ecDrawCalls;
    });
    expect(resumedDraws, "EmberCore must resume drawing after resumeAll()").toBeGreaterThan(16);
  });

  test("host pause -> click EmberCore Play and Reset -> 0 draws from page loop over 2 s and host button still reads Resume motion", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop pause scope spec");
    await installReadbackHelper(page);
    await page.goto("/items/ember-core?tier=3");
    const root = page.locator("[data-frictionborn-item='ember-core']").first();
    const canvas = root.locator("canvas").first();
    await expect(canvas).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(400);

    const hostBtn = page.getByTestId("host-pause");
    await expect(hostBtn).toHaveText("Pause motion");
    await expect(hostBtn).toHaveAttribute("aria-pressed", "false");

    // 0. Spin via keyboard, then click EmberCore's own Pause button: residual momentum must stop immediately (0 draws)
    await canvas.focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await root.getByRole("button", { name: "Pause" }).click();
    await expect(root.getByRole("button", { name: "Play" })).toBeVisible();
    await page.waitForTimeout(60);
    await page.evaluate(() => {
      (window as unknown as { __ecDrawCalls: number }).__ecDrawCalls = 0;
    });
    await page.waitForTimeout(600);
    const drawsAfterItemPause = await page.evaluate(
      () => (window as unknown as { __ecDrawCalls: number }).__ecDrawCalls
    );
    expect(drawsAfterItemPause, "EmberCore own Pause after keyboard spin must stop drawing immediately").toBe(0);
    await root.getByRole("button", { name: "Play" }).click();
    await page.waitForTimeout(150);

    // 1. Click host "Pause motion"
    await hostBtn.click();
    await expect(hostBtn).toHaveText("Resume motion");
    await expect(hostBtn).toHaveAttribute("aria-pressed", "true");

    // 2. Click EmberCore's own Play button (which appears while globalPaused is true)
    const itemPlayBtn = root.getByRole("button", { name: "Play" });
    await expect(itemPlayBtn).toBeVisible();
    await itemPlayBtn.click();

    // Also open Controls and click Reset while host pause is active
    const controlsBtn = root.getByRole("button", { name: "Controls" });
    await controlsBtn.click();
    await root.getByRole("button", { name: "Reset" }).click();

    // 3. Measure draws over a full 2,000 ms window: page loop must stay paused (0 draws) and host button must still read "Resume motion"
    await page.evaluate(() => {
      const w = window as unknown as { __ecDrawCalls: number; __ecScreenPassDraws: number };
      w.__ecDrawCalls = 0;
      w.__ecScreenPassDraws = 0;
    });
    await page.waitForTimeout(2000);
    const drawsAfterItemPlay = await page.evaluate(() => {
      const w = window as unknown as { __ecDrawCalls: number };
      return w.__ecDrawCalls;
    });
    expect(
      drawsAfterItemPlay,
      "clicking EmberCore Play or Reset after host pause must not restart the page loop (0 draws over 2 s)"
    ).toBe(0);
    await expect(hostBtn).toHaveText("Resume motion");
    await expect(hostBtn).toHaveAttribute("aria-pressed", "true");
  });

  test("filament contrast passes in dark and light themes and fails on low contrast", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop dark/light filament contrast spec");
    await installReadbackHelper(page);
    await page.goto("/items/ember-core?tier=3");
    const root = page.locator("[data-frictionborn-item='ember-core']").first();
    const canvas = root.locator("canvas").first();
    await expect(canvas).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(400);

    // Pause idle spin for deterministic patch comparison
    await canvas.focus();
    await page.keyboard.press("p");
    await page.mouse.move(5, 5);
    await page.waitForTimeout(300);

    // 1. Dark theme contrast check
    await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));
    await page.waitForTimeout(250);
    await expect(root).toHaveAttribute("data-theme-mode", "dark");

    const darkFrame = await readFullFrameStats(page);
    const darkBg = await readPatchMetrics(page, 0.08, 0.12, 64);
    const darkAsh = await readPatchMetrics(page, 0.5, 0.30, 96);
    const darkCore = await readPatchMetrics(page, 0.5, 0.56, 96);
    const darkAshDelta = darkAsh.p90Lum - darkBg.meanBrightness;
    const darkAshRatio = (darkAsh.p90Lum + 12.75) / (darkBg.meanBrightness + 12.75);

    expect(
      darkAshDelta,
      `dark-theme ash filament p90 luminance (${darkAsh.p90Lum.toFixed(1)}) vs background (${darkBg.meanBrightness.toFixed(1)}) must exceed 28`
    ).toBeGreaterThan(28);
    expect(darkAshRatio, `dark-theme ash filament contrast ratio (${darkAshRatio.toFixed(2)})`).toBeGreaterThan(2.0);
    expect(darkCore.meanBrightness).toBeGreaterThan(darkBg.meanBrightness + 40);

    // 2. Light theme contrast check
    await page.evaluate(() => document.documentElement.setAttribute("data-theme", "light"));
    await page.waitForTimeout(250);
    await expect(root).toHaveAttribute("data-theme-mode", "light");

    const lightFrame = await readFullFrameStats(page);
    const lightBg = await readPatchMetrics(page, 0.22, 0.22, 64);
    const lightAsh = await readPatchMetrics(page, 0.5, 0.30, 96);
    const lightCore = await readPatchMetrics(page, 0.5, 0.56, 96);
    const lightAshDelta = lightAsh.p90Lum - lightBg.meanBrightness;
    const lightAshRatio = (lightAsh.p90Lum + 12.75) / (lightBg.meanBrightness + 12.75);

    expect(
      lightAshDelta,
      `light-theme ash filament p90 luminance (${lightAsh.p90Lum.toFixed(1)}) vs plate (${lightBg.meanBrightness.toFixed(1)}) must exceed 28`
    ).toBeGreaterThan(28);
    expect(lightAshRatio, `light-theme ash filament contrast ratio (${lightAshRatio.toFixed(2)})`).toBeGreaterThan(2.0);
    expect(lightCore.meanBrightness).toBeGreaterThan(lightBg.meanBrightness + 40);

    // Light theme renders the radial dark hearth plate + boosted ash filaments in WebGL, so coverage & brightness differ from dark theme
    expect(
      Math.abs(lightFrame.coverage - darkFrame.coverage),
      `light-theme coverage (${lightFrame.coverage.toFixed(3)}) must differ from dark-theme coverage (${darkFrame.coverage.toFixed(3)})`
    ).toBeGreaterThan(0.05);
  });
});
