// Original — Frictionborn Motion: EmberCore's tier-3 pixel specs need a GPU; CI has none.
// CI draws WebGL in software (SwiftShader on shared vCPUs). Measured in the CI image (mcr.microsoft.com/playwright, 4 CPUs),
// EmberCore's tier 3 runs at 5-10 fps at any canvas size (p75 frame 100-183 ms, also at 498x280): its frame guard (p75 > 25 ms
// for 2 s) drops it to tier 2 within seconds, as it should on a slow device, and the specs that read tier-3 pixels after hover,
// drag, click, pauseAll or a context restore failed on GitHub (no change, or a dimmer frame) while passing on a GPU machine.
// On GitHub Actions with a software renderer those specs are skipped with this reason; everywhere else (the release bench, and the owner's
// machine, which also uses SwiftShader through playwright.config.ts but is fast enough) they run and must pass.
import { test, type Page } from "@playwright/test";

/** The WebGL renderer string when it is a software renderer (SwiftShader, llvmpipe), else null. */
export async function softwareWebGLRenderer(page: Page): Promise<string | null> {
  const renderer = await page.evaluate(() => {
    const gl = document.createElement("canvas").getContext("webgl2");
    if (!gl) return "";
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const name = String(info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return name;
  });
  return /swiftshader|llvmpipe|softpipe/i.test(renderer) ? renderer : null;
}

/** Call first in a spec that needs EmberCore to keep rendering at tier 3. */
export async function needsGpuForTier3(page: Page): Promise<void> {
  // GITHUB_ACTIONS, not CI: bench/run-bench.ts sets CI=1 for every bench run, on any machine
  if (!process.env.GITHUB_ACTIONS) return;
  const renderer = await softwareWebGLRenderer(page);
  test.skip(
    renderer !== null,
    `CI draws WebGL in software (${renderer}); EmberCore's tier 3 runs at 5-10 fps there and its frame guard drops it to tier 2, so these tier-3 pixels are checked on GPU machines (release bench)`
  );
}
