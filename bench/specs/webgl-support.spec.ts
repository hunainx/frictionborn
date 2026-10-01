// Original — Frictionborn Motion WebGL2 availability probe (records, never fails; feeds DECISIONS O4)
import { test } from "@playwright/test";

const item = process.env.BENCH_ITEM || "noise-field";

test("records WebGL2 availability and the tier the runtime picks", async ({ page, browserName }, testInfo) => {
  test.skip(item !== "noise-field", "recorded once per run");
  await page.goto("/");
  const info = await page.evaluate(() => {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2");
    return { webgl2: !!gl, renderer: gl ? String(gl.getParameter(gl.RENDERER)) : null };
  });
  const line = `FB_WEBGL2 project=${testInfo.project.name} browser=${browserName} webgl2=${info.webgl2} renderer=${info.renderer}`;
  console.log(line);
  testInfo.annotations.push({ type: "webgl2", description: line });
});
