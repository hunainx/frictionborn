// Original — Frictionborn Motion SSR server-safe spec
import { test, expect } from "@playwright/test";

const item = process.env.BENCH_ITEM || "noise-field";

test.describe("Server-rendered output spec", () => {
  test("server HTML includes static layout and text without JavaScript execution", async ({ request }) => {
    const response = await request.get(`/items/${item}`);
    expect(response.status()).toBe(200);

    const html = await response.text();
    // Static item attribute must be in server HTML
    expect(html).toContain(`data-frictionborn-item="${item}"`);

    // Rule 1: No opacity: 0 on server HTML elements without data-motion="ok"
    expect(html).not.toMatch(/style="[^"]*opacity:\s*0[^"]*"/);
  });
});
