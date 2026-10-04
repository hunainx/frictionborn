// Original — Frictionborn Motion DistortionImage 30-image stress, lease, leak and behaviour spec
import fs from "node:fs";
import { test, expect, type Page } from "@playwright/test";

// Context + texture accounting from the injected probes (public/probes.js).
const probeStats = (page: Page) =>
  page.evaluate(() => {
    const p = window.__FB_PROBES__;
    const c = p?.contextCounter.getStats();
    const t = p?.textureCounter?.getStats();
    return {
      activeContexts: c?.activeContexts ?? 0,
      totalContexts: c?.totalCreated ?? 0,
      unplannedLosses: c?.unplannedLosses ?? 0,
      activeTextures: t?.activeTextures ?? 0,
      texturesCreated: t?.totalCreated ?? 0,
      texturesDeleted: t?.totalDeleted ?? 0,
    };
  });

// Headless Firefox on Linux has no WebGL2: those projects only cover the plain-image fallback.
const webgl2Supported = (page: Page) =>
  page.evaluate(() => {
    const gl = document.createElement("canvas").getContext("webgl2");
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  });

const finePointer = (page: Page) => page.evaluate(() => window.matchMedia("(pointer: fine)").matches);

test.describe("DistortionImage Stress, Budget, and Leak DoD", () => {
  test("strictly enforces glBudget ceiling <= 4 on desktop (fine) and <= 2 on mobile (coarse) across 30 images", async ({
    page,
  }) => {
    await page.goto("/stress-distortion?tier=3");
    await page.waitForSelector("[data-testid='stress-distortion-container']");
    await page.waitForTimeout(1000);

    // Verify all 30 images mounted in the DOM
    const itemCount = await page.locator("[data-frictionborn-item='distortion-image']").count();
    expect(itemCount).toBe(30);

    // Verify all 30 images have real <img> tags defining layout (0 CLS)
    const imgCount = await page.locator("[data-frictionborn-item='distortion-image'] img").count();
    expect(imgCount).toBe(30);

    const isFine = await finePointer(page);
    const maxCeiling = isFine ? 4 : 2;

    // Hover across the first 6 items to request multiple leases
    if (isFine) {
      for (let i = 1; i <= 6; i++) {
        const item = page.locator(`[data-testid='stress-item-${i}']`);
        await item.scrollIntoViewIfNeeded();
        await item.hover();
        await page.waitForTimeout(100);
      }
    }

    const stats = await probeStats(page);
    expect(stats.unplannedLosses).toBe(0);
    expect(stats.activeContexts).toBeLessThanOrEqual(maxCeiling);
  });

  test("releases lease after 3 seconds of idle when pointer leaves element", async ({ page }) => {
    if (!(await finePointer(page))) return; // Touch pointers don't acquire hover leases

    await page.goto("/stress-distortion?tier=3");
    await page.waitForSelector("[data-testid='stress-distortion-container']");
    if (!(await webgl2Supported(page))) return; // no WebGL2 (headless Firefox on Linux): plain-image fallback only
    await page.waitForTimeout(500);

    const firstItem = page.locator("[data-testid='stress-item-1']");
    await firstItem.scrollIntoViewIfNeeded();

    // Hover to trigger lease acquisition
    await firstItem.hover();

    // Verify a WebGL canvas overlay is rendered while hovering (waiting for React.lazy chunk load)
    const canvas = firstItem.locator("canvas");
    await canvas.waitFor({ state: "attached", timeout: 8000 });
    expect(await canvas.count()).toBe(1);

    // Move mouse away to header
    await page.locator("[data-testid='stress-distortion-container'] header").hover();

    // Within the 3s grace period, canvas might still linger
    await page.waitForTimeout(500);

    // Wait past the 3s idle release timer (3.5s total)
    await page.waitForTimeout(3200);

    // The lease must be released and canvas overlay unmounted
    await canvas.waitFor({ state: "detached", timeout: 5000 });
    expect(await canvas.count()).toBe(0);
  });

  test("50 mount/unmount cycles with live leases leave 0 leaked contexts and 0 leaked textures", async ({
    page,
  }, testInfo) => {
    // 50 cycles on desktop projects, 25 on mobile/fallbacks per Decision 23
    const isFullSpec = ["chromium-desktop", "webkit-desktop"].includes(testInfo.project.name);
    const cycles = isFullSpec ? 50 : 25;
    test.setTimeout(120_000);

    await page.goto(`/stress-distortion?leak=1&tier=3&cycles=${cycles}`);
    const webgl2 = await webgl2Supported(page);
    const fine = await finePointer(page);
    await page.waitForSelector("[data-leak-done='true']", { timeout: 100_000 });
    await page.waitForTimeout(500);

    const stats = await probeStats(page);
    expect(stats.activeContexts).toBe(0);
    expect(stats.activeTextures).toBe(0);
    expect(stats.unplannedLosses).toBe(0);

    // The cycles must have done real work, otherwise "0 leaked" proves nothing: every cycle unmounts while
    // two leases are live, so textures were created, and every one of them was deleted again.
    if (webgl2 && fine && testInfo.project.name.startsWith("chromium")) {
      expect(stats.texturesCreated).toBeGreaterThanOrEqual(cycles);
      expect(stats.texturesDeleted).toBe(stats.texturesCreated);
    }
  });

  test("100 hover-in/out cycles across images leave 0 leaked contexts and 0 leaked textures", async ({
    page,
  }) => {
    if (!(await finePointer(page))) return; // Touch pointers don't acquire hover leases

    test.setTimeout(90_000);
    await page.goto("/stress-distortion?tier=3");
    await page.waitForSelector("[data-testid='stress-distortion-container']");
    await page.waitForTimeout(500);

    // Perform 100 real pointer hover cycles across items 1 to 4 (25 rounds x 4 items)
    const items = [1, 2, 3, 4].map((i) => page.locator(`[data-testid='stress-item-${i}']`));
    for (let round = 0; round < 25; round++) {
      for (const item of items) {
        await item.hover();
      }
    }

    // Move pointer away to container header so all items are left
    await page.locator("[data-testid='stress-distortion-container'] header").hover();

    // All temporary leases must release once the 3 s idle timers expire (poll: a slow runner may need longer than
    // the timer itself, and the assertion is about eventually releasing everything).
    await expect.poll(async () => (await probeStats(page)).activeContexts, { timeout: 10_000 }).toBe(0);
    await expect.poll(async () => (await probeStats(page)).activeTextures, { timeout: 5_000 }).toBe(0);
    expect((await probeStats(page)).unplannedLosses).toBe(0);
  });

  test("a sixth image hovered within 3 s still gets a context at once (idle leases are evicted, LRU first)", async ({
    page,
  }) => {
    if (!(await finePointer(page))) return;
    await page.goto("/stress-distortion?tier=3");
    await page.waitForSelector("[data-testid='stress-distortion-container']");
    if (!(await webgl2Supported(page))) return;
    await page.waitForTimeout(500);

    for (let i = 1; i <= 6; i++) {
      const item = page.locator(`[data-testid='stress-item-${i}']`);
      await item.scrollIntoViewIfNeeded();
      await item.hover();
      await page.waitForTimeout(100);
    }

    // Without eviction the sixth image waits for the first lease's 3 s idle release.
    await expect(page.locator("[data-testid='stress-item-6'] canvas")).toHaveCount(1, { timeout: 1500 });
    const stats = await probeStats(page);
    expect(stats.activeContexts).toBeLessThanOrEqual(4);
    expect(stats.unplannedLosses).toBe(0);
  });

  test("a pointer resting on an image releases its context after about 3 s without movement", async ({ page }) => {
    if (!(await finePointer(page))) return;
    await page.goto("/stress-distortion?tier=3");
    await page.waitForSelector("[data-testid='stress-distortion-container']");
    if (!(await webgl2Supported(page))) return;
    await page.waitForTimeout(500);

    const item = page.locator("[data-testid='stress-item-1']");
    await item.scrollIntoViewIfNeeded();
    await item.hover();
    await expect(item.locator("canvas")).toHaveCount(1, { timeout: 8000 });

    // No movement from here on. Still live well inside the idle window ...
    await page.waitForTimeout(1500);
    expect(await item.locator("canvas").count()).toBe(1);
    // ... and gone shortly after it, with the pointer still on the image.
    await expect(item.locator("canvas")).toHaveCount(0, { timeout: 6000 });
    await expect.poll(async () => (await probeStats(page)).activeContexts, { timeout: 3000 }).toBe(0);
  });

  test("hovering shows the picture itself: the framebuffer is not blank or flat", async ({ page }) => {
    if (!(await finePointer(page))) return;
    await page.addInitScript(() => {
      (window as any).__lastDraw = null;
      const orig = WebGL2RenderingContext.prototype.drawArrays;
      WebGL2RenderingContext.prototype.drawArrays = function (this: WebGL2RenderingContext, ...a: [number, number, number]) {
        const r = orig.apply(this, a);
        try {
          const w = this.drawingBufferWidth;
          const h = this.drawingBufferHeight;
          const buf = new Uint8Array(w * h * 4);
          this.readPixels(0, 0, w, h, this.RGBA, this.UNSIGNED_BYTE, buf);
          let sum = 0;
          let sumSq = 0;
          let covered = 0;
          for (let i = 0; i < buf.length; i += 4) {
            const v = (buf[i] + buf[i + 1] + buf[i + 2] + buf[i + 3]) / 4;
            sum += v;
            sumSq += v * v;
            if (buf[i + 3] > 0) covered++;
          }
          const n = w * h;
          const mean = sum / n;
          (window as any).__lastDraw = { std: Math.sqrt(Math.max(0, sumSq / n - mean * mean)), coverage: covered / n };
        } catch {
          // context lost mid-read
        }
        return r;
      };
    });
    await page.goto("/stress-distortion?tier=3");
    await page.waitForSelector("[data-testid='stress-distortion-container']");
    if (!(await webgl2Supported(page))) return;
    await page.waitForTimeout(500);

    const item = page.locator("[data-testid='stress-item-1']");
    await item.scrollIntoViewIfNeeded();
    const box = (await item.boundingBox())!;
    await page.mouse.move(box.x + box.width * 0.3, box.y + 90);
    for (let i = 0; i < 10; i++) {
      await page.mouse.move(box.x + box.width * (0.3 + i * 0.02), box.y + 90);
      await page.waitForTimeout(80);
    }
    await expect(item.locator("canvas")).toHaveCount(1, { timeout: 8000 });
    // Let the ripple ease in, then read what was really drawn.
    await expect
      .poll(async () => page.evaluate(() => (window as any).__lastDraw?.coverage ?? 0), { timeout: 5000 })
      .toBeGreaterThan(0.9);
    const draw = await page.evaluate(() => (window as any).__lastDraw);
    expect(draw.std).toBeGreaterThan(2); // a cleared or single-colour canvas has std 0
  });

  test("keyboard focus draws a visible ring inside the box, above the canvas", async ({ page }) => {
    await page.goto("/distortion-cases?tier=3");
    await page.waitForSelector("[data-testid='cases-root']");
    const webgl2 = await webgl2Supported(page);
    const wrapper = page.locator("[data-testid='case-default-props'] [data-frictionborn-item]");
    await wrapper.scrollIntoViewIfNeeded();
    await wrapper.focus();

    const ring = wrapper.locator("[data-frictionborn-focus-ring]");
    await expect(ring).toHaveCount(1);
    const style = await ring.evaluate((el) => {
      const cs = getComputedStyle(el);
      const wrap = el.parentElement!.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      return {
        shadow: cs.boxShadow,
        z: Number(cs.zIndex),
        sameBox: Math.abs(r.width - wrap.width) < 1 && Math.abs(r.height - wrap.height) < 1,
      };
    });
    expect(style.shadow).not.toBe("none");
    expect(style.sameBox).toBe(true); // drawn inside the box, so overflow:hidden parents cannot clip it

    if (webgl2 && (await finePointer(page))) {
      // Focus also lights the effect; the ring must sit above the canvas layer.
      await expect(wrapper.locator("canvas")).toHaveCount(1, { timeout: 8000 });
      const canvasZ = await wrapper
        .locator("canvas")
        .evaluate((c) => Number(getComputedStyle(c.parentElement as HTMLElement).zIndex));
      expect(style.z).toBeGreaterThan(canvasZ);
    }

    await wrapper.evaluate((el) => (el as HTMLElement).blur());
    await expect(ring).toHaveCount(0);
  });

  test("a srcset candidate chosen on resize is uploaded to the texture while the canvas is live", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "browser-agnostic component logic; Chromium is enough");
    await page.setViewportSize({ width: 600, height: 900 });
    await page.addInitScript(() => {
      (window as any).__uploads = [];
      const orig = WebGL2RenderingContext.prototype.texImage2D as (...a: unknown[]) => void;
      (WebGL2RenderingContext.prototype as any).texImage2D = function (this: unknown, ...a: unknown[]) {
        const src = a[a.length - 1] as HTMLImageElement | null;
        (window as any).__uploads.push(src?.currentSrc ? src.currentSrc.split("/").pop() : null);
        return orig.apply(this, a);
      };
    });
    await page.goto("/distortion-cases?tier=3");
    await page.waitForSelector("[data-testid='cases-root']");
    const section = page.locator("[data-testid='case-srcset']");
    const img = section.locator("img");
    await section.scrollIntoViewIfNeeded();
    await expect.poll(() => img.evaluate((i: HTMLImageElement) => i.currentSrc.split("/").pop())).toBe("art-1.webp");

    await img.hover();
    await expect(section.locator("canvas")).toHaveCount(1, { timeout: 8000 });
    await expect.poll(() => page.evaluate(() => (window as any).__uploads)).toContain("art-1.webp");

    // Widening the viewport makes the browser pick the larger candidate.
    await page.setViewportSize({ width: 1200, height: 900 });
    await expect.poll(() => img.evaluate((i: HTMLImageElement) => i.currentSrc.split("/").pop())).toBe("art-2.webp");
    const box = (await img.boundingBox())!;
    await page.mouse.move(box.x + 40, box.y + 40);
    await page.mouse.move(box.x + 60, box.y + 50);
    await expect.poll(() => page.evaluate(() => (window as any).__uploads), { timeout: 5000 }).toContain("art-2.webp");
  });

  test("when WebGL2 is refused despite the tier, no dead canvas stays mounted and it stops retrying", async ({
    page,
  }) => {
    if (!(await finePointer(page))) return;
    await page.addInitScript(() => {
      (window as any).__gl2Calls = 0;
      const orig = HTMLCanvasElement.prototype.getContext as (this: HTMLCanvasElement, ...a: unknown[]) => unknown;
      (HTMLCanvasElement.prototype as any).getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
        if (type === "webgl2") {
          (window as any).__gl2Calls++;
          return null; // the browser refuses (context limit, blocked, no GPU)
        }
        return orig.call(this, type, ...rest);
      };
    });
    await page.goto("/stress-distortion?tier=3");
    await page.waitForSelector("[data-testid='stress-distortion-container']");
    const item = page.locator("[data-testid='stress-item-1']");
    await item.scrollIntoViewIfNeeded();
    const box = (await item.boundingBox())!;
    for (let i = 0; i < 8; i++) {
      await page.mouse.move(box.x + 40 + i * 10, box.y + 60);
      await page.waitForTimeout(120);
    }
    await page.waitForTimeout(1500);

    expect(await item.locator("canvas").count()).toBe(0);
    await expect(item.locator("img")).toBeVisible();
    // A bounded number of attempts (StrictMode may double them), not a retry loop.
    expect(await page.evaluate(() => (window as any).__gl2Calls)).toBeLessThanOrEqual(6);
  });

  test("changing strength or speed does not rebuild the WebGL context", async ({ page }) => {
    if (!(await finePointer(page))) return;
    await page.goto("/items/distortion-image?tier=3");
    if (!(await webgl2Supported(page))) return;
    const featured = page.locator("article#demo-mount-point");
    await featured.scrollIntoViewIfNeeded();
    await featured.hover();
    await expect(featured.locator("canvas")).toHaveCount(1, { timeout: 8000 });
    const before = await probeStats(page);

    for (const id of ["#distortion-strength", "#distortion-speed"]) {
      await page.locator(id).focus();
      for (let i = 0; i < 3; i++) await page.keyboard.press("ArrowRight");
    }
    await page.waitForTimeout(500);

    const after = await probeStats(page);
    expect(after.totalContexts).toBe(before.totalContexts);
    expect(after.texturesCreated).toBe(before.texturesCreated);
  });

  test("a cross-origin image without CORS headers falls back to the plain image without errors", async ({
    page,
    context,
  }) => {
    if (!(await finePointer(page))) return;
    const artwork = fs.readFileSync("public/assets/distortion/art-1.webp");
    await context.route("https://cdn.noncors.test/**", (route) =>
      route.fulfill({ status: 200, contentType: "image/webp", body: artwork })
    );
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });

    await page.goto("/distortion-cases?tier=3");
    await page.waitForSelector("[data-testid='cases-root']");
    const webgl2 = await webgl2Supported(page);
    const section = page.locator("[data-testid='case-cross-origin']");
    const img = section.locator("img");
    await expect.poll(() => img.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0)).toBe(true);
    await img.hover();
    await page.waitForTimeout(2500);

    expect(await section.locator("canvas").count()).toBe(0);
    await expect(img).toBeVisible();
    const stats = await probeStats(page);
    expect(stats.activeContexts).toBe(0);
    expect(stats.activeTextures).toBe(0);
    if (webgl2) expect(stats.texturesCreated).toBeGreaterThan(0); // the upload was really attempted and refused
    expect(errors).toEqual([]);
  });
});
