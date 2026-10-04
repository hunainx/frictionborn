// Original — Frictionborn Motion Marquee: the pause control must be able to resume (WCAG 2.2.2)
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const item = process.env.BENCH_ITEM || "marquee";

test.describe("Marquee pause control", () => {
  test.skip(item !== "marquee", "marquee only");

  test("Play resumes while the pointer is still on the button, and the hover pause still works on the track", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name.includes("mobile"), "needs a hovering pointer");
    await page.goto("/items/marquee");
    const root = page.locator("[data-frictionborn-item='marquee']").first();
    await expect(root).toBeVisible();
    const state = () => root.locator(".fb-marquee-track").first().evaluate((el) => getComputedStyle(el).animationPlayState);
    await expect.poll(state).toBe("running");

    // Hover the track: paused (pauseOnHover default)
    await root.locator(".fb-marquee-viewport").hover();
    await expect.poll(state).toBe("paused");

    // Button: Pause, then Play, pointer never leaves the button and focus stays on it
    const button = root.getByRole("button", { name: /pause scrolling ticker/i });
    await button.click();
    await expect.poll(state).toBe("paused");
    const play = root.getByRole("button", { name: /play scrolling ticker/i });
    await play.click();
    await expect(play).toBeFocused().catch(() => {});
    // The pointer is still over the control and the control still has focus: it must be running again.
    await expect.poll(state, { message: "Play did not resume: the hover/focus pause rules also match the pause button" }).toBe("running");
  });

  test("keyboard: Space on the focused Pause button pauses, Space again resumes", async ({ page }) => {
    await page.goto("/items/marquee");
    const root = page.locator("[data-frictionborn-item='marquee']").first();
    const state = () => root.locator(".fb-marquee-track").first().evaluate((el) => getComputedStyle(el).animationPlayState);
    await expect.poll(state).toBe("running");
    const pause = root.getByRole("button", { name: /pause scrolling ticker/i });
    await pause.focus();
    await page.keyboard.press("Space");
    await expect.poll(state).toBe("paused");
    await page.keyboard.press("Space");
    await expect.poll(state, { message: "Play did not resume while the button has focus (focus-within pause matches the button)" }).toBe("running");
  });

  test("reduced motion: the hand-scrollable row is keyboard focusable (axe scrollable-region-focusable, WCAG 2.1.1)", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/items/marquee");
    await page.waitForSelector("[data-frictionborn-item='marquee']");
    const results = await new AxeBuilder({ page }).withRules(["scrollable-region-focusable"]).analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  });
});
