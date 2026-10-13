// Original — Frictionborn Motion bench: interaction spec for the 2D-canvas items ported from the component lab (round 4, DECISIONS 54)
/**
 * The generic specs load an item and measure it; they do not prove that a canvas item draws, answers the keyboard or goes quiet.
 * For each canvas item this spec (1) checks it is idle after load (no frames), (2) drives its main control with the KEYBOARD only and
 * checks the accessible state, (3) reads the item's canvas pixels back to prove the effect drew, and (4) checks the loop stops again once
 * the effect has settled (an idle item costs zero frames). A recipe per item; items without one are skipped.
 */
import { test, expect, type Page } from "@playwright/test";

const item = process.env.BENCH_ITEM || "flame-switch";

interface Recipe {
  /** keyboard path to the main effect; returns a description of the state reached */
  act: (page: Page) => Promise<void>;
  /** the accessible state after `act` */
  state: (page: Page) => Promise<void>;
  /** the keyboard path with reduced motion, when it differs (an item whose effect control does not exist there) */
  reducedAct?: (page: Page) => Promise<void>;
  /** the accessible state after `act` with reduced motion, when it differs (static items do not animate their state) */
  reducedState?: (page: Page) => Promise<void>;
  /** puts the item back at rest (optional) */
  rest?: (page: Page) => Promise<void>;
  /** how long the effect needs to settle before the loop must be idle */
  settleMs: number;
  /** how long the reduced-motion run waits after `act` before it must be idle (default 1500; longer when the demo itself keeps changing values) */
  reducedSettleMs?: number;
  /** when to read the pixels after `act` (ms, default 700) and how many must be inked (default 200) */
  inkDelay?: number;
  minInk?: number;
  /** the item draws continuously while visible by design (a background): skip the idle-after-effect check */
  continuous?: boolean;
}

const root = (page: Page) => page.locator(`[data-frictionborn-item='${item}']`).first();

const RECIPES: Record<string, Recipe> = {
  "lantern-sky": {
    // a background: it draws while visible by design; the keyboard path is its Pause button, which must stop every frame
    act: async (page) => {
      await root(page).getByRole("button", { name: "Pause the lanterns" }).focus();
      await page.keyboard.press("Enter");
    },
    state: async (page) => expect(root(page).getByRole("button", { name: "Play the lanterns" })).toBeVisible(),
    reducedAct: async (page) => expect(root(page).getByRole("button")).toHaveCount(0),
    reducedState: async (page) => expect(root(page).getByRole("heading", { name: "Let it rise." })).toBeVisible(),
    inkDelay: 200,
    minInk: 5000,
    settleMs: 300,
    continuous: true,
  },
  "ash-text": {
    act: async (page) => {
      await root(page).getByRole("button", { name: /Blow/ }).focus();
      await page.keyboard.press("Enter");
    },
    state: async (page) => expect(root(page).getByRole("heading", { name: "Ephemeral" })).toBeAttached(),
    // reduced motion: the real text only, no button to press
    reducedAct: async (page) => expect(root(page).getByRole("button")).toHaveCount(0),
    reducedState: async (page) => expect(root(page).getByRole("heading", { name: "Ephemeral" })).toBeVisible(),
    inkDelay: 1200,
    settleMs: 6000,
  },
  "firework-rating": {
    act: async (page) => {
      await root(page).getByRole("radio", { name: "1 star" }).focus();
      for (let i = 0; i < 3; i++) await page.keyboard.press("ArrowRight");
    },
    state: async (page) => {
      await expect(root(page).getByRole("radio", { name: "4 stars" })).toHaveAttribute("aria-checked", "true");
      await expect(root(page).getByRole("radio", { name: "4 stars" })).toBeFocused();
    },
    inkDelay: 500,
    settleMs: 4000,
  },
  "eclipse-switch": {
    act: async (page) => {
      await root(page).getByRole("switch").focus();
      await page.keyboard.press("Space");
    },
    state: async (page) => {
      await expect(root(page).getByRole("switch")).toHaveAttribute("aria-checked", "true");
      await expect(root(page).getByText("Totality")).toBeVisible();
    },
    settleMs: 5500,
  },
  "hold-to-confirm": {
    act: async (page) => {
      await root(page).getByRole("button", { name: /Hold to delete/ }).focus();
      await page.keyboard.down("Enter");
      await page.waitForTimeout(1250);
      await page.keyboard.up("Enter");
    },
    state: async (page) => {
      await expect(root(page).getByRole("status")).toContainText("Draft deleted.");
      await expect(root(page).getByRole("button", { name: "Undo" })).toBeFocused();
    },
    rest: async (page) => {
      await page.waitForTimeout(3500);
      await page.keyboard.press("Enter");
      await expect(root(page).getByRole("button", { name: /Hold to delete/ })).toBeFocused();
    },
    inkDelay: 250,
    settleMs: 1500,
  },
  "flint-button": {
    act: async (page) => {
      // the item's root is the <button> itself
      await root(page).focus();
      await page.keyboard.press("Enter");
      await page.waitForTimeout(320);
      await page.keyboard.press("Enter");
    },
    state: async (page) => expect(root(page)).toHaveText("Lit"),
    // reduced motion: a plain button; the click still reaches the page (the demo counts strikes)
    reducedState: async (page) => expect(page.getByText("2 strikes.", { exact: false })).toBeVisible(),
    inkDelay: 150,
    settleMs: 9000,
  },
  "fuse-toast": {
    act: async (page) => {
      await page.getByRole("button", { name: "Archive" }).focus();
      await page.keyboard.press("Enter");
      // the fuse holds while focus is inside the toast; focus stays on the archive button, so it burns
    },
    state: async (page) => expect(root(page).getByRole("status")).toContainText("Message archived."),
    inkDelay: 400,
    settleMs: 6500,
    reducedSettleMs: 6500,
  },
  "match-progress": {
    act: async (page) => {
      await page.getByRole("button", { name: "Run the bench" }).focus();
      await page.keyboard.press("Enter");
    },
    state: async (page) => expect(root(page).getByRole("progressbar")).not.toHaveAttribute("aria-valuenow", "0"),
    inkDelay: 1500,
    settleMs: 14000,
    reducedSettleMs: 6000,
  },
  "temper-slider": {
    act: async (page) => {
      await root(page).getByRole("slider").focus();
      for (let i = 0; i < 10; i++) await page.keyboard.press("ArrowRight");
    },
    state: async (page) => expect(root(page).getByRole("slider")).toHaveAttribute("aria-valuetext", /^260 degrees, /),
    settleMs: 300,
  },
  "light-leak-tabs": {
    act: async (page) => {
      await root(page).getByRole("tab", { name: "Heat" }).focus();
      await page.keyboard.press("End");
    },
    state: async (page) => {
      await expect(root(page).getByRole("tab", { name: "Ash" })).toHaveAttribute("aria-selected", "true");
      await expect(root(page).getByRole("tab", { name: "Ash" })).toBeFocused();
    },
    settleMs: 1200,
  },
  "ember-badge": {
    act: async (page) => {
      await page.getByRole("button", { name: "New note" }).focus();
      await page.keyboard.press("Enter");
    },
    state: async (page) => expect(root(page).getByRole("status")).toHaveText(/^4 /),
    inkDelay: 120,
    minInk: 60,
    settleMs: 5000,
  },
  "flame-switch": {
    act: async (page) => {
      await root(page).getByRole("switch").focus();
      await page.keyboard.press("Space");
    },
    state: async (page) => expect(root(page).getByRole("switch")).toHaveAttribute("aria-checked", "true"),
    rest: async (page) => {
      await page.keyboard.press("Space");
      await expect(root(page).getByRole("switch")).toHaveAttribute("aria-checked", "false");
    },
    settleMs: 4200,
  },
};

/** non-transparent pixels across the item's canvases (read back, so a blank canvas reads 0) */
async function inkedPixels(page: Page): Promise<number> {
  return page.evaluate((name) => {
    // the item's canvases sit inside its root, or beside it when the root is the control itself (FlintButton's <button>)
    const el = document.querySelector(`[data-frictionborn-item='${name}']`)?.parentElement;
    let n = 0;
    el?.querySelectorAll("canvas").forEach((cv) => {
      const g = (cv as HTMLCanvasElement).getContext("2d");
      if (!g || !cv.width || !cv.height) return;
      const d = g.getImageData(0, 0, cv.width, cv.height).data;
      for (let i = 3; i < d.length; i += 4) if (d[i] > 8) n++;
    });
    return n;
  }, item);
}

/** hydrated and mounted: the item has created its canvas (event handlers are attached by then) */
async function mounted(page: Page): Promise<void> {
  await expect(root(page).locator("xpath=..").locator("canvas").first()).toBeAttached({ timeout: 10_000 });
}

async function framesOver(page: Page, ms: number): Promise<number> {
  await page.evaluate(() => window.__FB_PROBES__?.frameCounter.reset());
  await page.waitForTimeout(ms);
  return page.evaluate(() => window.__FB_PROBES__?.frameCounter.getStats().totalFrames ?? -1);
}

test.describe("canvas item: keyboard, pixels, quiet when idle", () => {
  test.skip(!RECIPES[item], `no canvas recipe for ${item}`);
  test.use({ colorScheme: "dark" });

  test(`${item}: idle after load, draws on the keyboard path, idle again once settled`, async ({ page, browserName }) => {
    // Firefox in this setup has no WebGL2, so the runtime reports tier 0 there and the canvas effects are off by design
    test.skip(browserName === "firefox", "tier 0 without WebGL2: the effect is off by design");
    const r = RECIPES[item];
    await page.goto(`/items/${item}`);
    await root(page).waitFor({ state: "attached" });
    await mounted(page);
    await page.waitForTimeout(1000);
    if (!r.continuous) expect(await framesOver(page, 1000), "frames while idle after load").toBeLessThanOrEqual(2);
    else expect(await framesOver(page, 1000), "a background draws while visible").toBeGreaterThan(20);

    await r.act(page);
    await r.state(page);
    await page.waitForTimeout(r.inkDelay ?? 700);
    expect(await inkedPixels(page), "the effect drew on the canvas").toBeGreaterThan(r.minInk ?? 200);

    if (r.continuous) {
      // the pause pressed in `act` must stop every frame
      expect(await framesOver(page, 1000), "frames while paused").toBeLessThanOrEqual(2);
      return;
    }
    await r.rest?.(page);
    await page.waitForTimeout(r.settleMs);
    expect(await framesOver(page, 1000), "frames once the effect has settled").toBeLessThanOrEqual(2);
  });

  test(`${item}: reduced motion still answers the keyboard and stops drawing`, async ({ page }) => {
    const r = RECIPES[item];
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`/items/${item}`);
    await root(page).waitFor({ state: "attached" });
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(800);
    await (r.reducedAct ?? r.act)(page);
    await (r.reducedState ?? r.state)(page);
    await page.waitForTimeout(r.reducedSettleMs ?? 1500);
    expect(await framesOver(page, 1000), "no frames after the reduced-motion still").toBe(0);
  });
});
