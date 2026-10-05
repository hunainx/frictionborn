// Original — Frictionborn Motion MeshGradient default speed spec.
// `speed` is a unitless multiplier (docs/API-CONVENTIONS.md): speed 1 must advance the shader clock at the same rate the item
// always ran at by default, 0.35 shader seconds per real second (DESIGN A2: slow ambient motion). The audit found the default
// changed from 0.35 to 1 with the scale applied only to a shader uniform nobody reads, so the default drift ran 2.86x faster.
// This spec reads the real u_time uniform the GL component writes, in a real browser.
import { test, expect } from "@playwright/test";

const item = process.env.BENCH_ITEM ?? "";
const RATE = 0.35;

test.describe("MeshGradient default speed", () => {
  test.skip(item !== "mesh-gradient", "mesh-gradient only");

  test("with no props the shader clock runs at 0.35 s per real second", async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as any;
      w.__meshTime = [];
      const P = WebGL2RenderingContext.prototype;
      const names = new WeakMap<object, string>();
      const getLoc = P.getUniformLocation;
      P.getUniformLocation = function (this: WebGL2RenderingContext, prog: WebGLProgram, name: string) {
        const loc = getLoc.call(this, prog, name);
        if (loc) names.set(loc, name);
        return loc;
      };
      const uniform1f = P.uniform1f;
      P.uniform1f = function (this: WebGL2RenderingContext, loc: WebGLUniformLocation | null, v: number) {
        if (loc && names.get(loc) === "u_time") w.__meshTime.push([performance.now(), v]);
        return uniform1f.call(this, loc, v);
      };
    });
    await page.goto("/mesh-default");
    const canvas = page.locator("[data-frictionborn-item='mesh-gradient'] canvas").first();
    const hasCanvas = await canvas.waitFor({ state: "attached", timeout: 8000 }).then(() => true, () => false);
    test.skip(!hasCanvas, "no WebGL canvas in this browser");
    await page.waitForFunction(() => (window as any).__meshTime.length > 30, null, { timeout: 15000 });
    await page.waitForTimeout(2500);
    const samples: [number, number][] = await page.evaluate(() => (window as any).__meshTime);
    const a = samples[10];
    const b = samples[samples.length - 1];
    const rate = (b[1] - a[1]) / ((b[0] - a[0]) / 1000);
    expect(rate, `shader seconds per real second (${samples.length} frames)`).toBeGreaterThan(RATE * 0.85);
    expect(rate, `shader seconds per real second (${samples.length} frames)`).toBeLessThan(RATE * 1.15);
  });
});
