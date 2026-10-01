// Original — Frictionborn Motion SSR server-safe spec
import { test, expect } from "@playwright/test";

test.describe("Server-rendered output spec", () => {
  test("server HTML includes static layout and text without JavaScript execution", async ({ request }) => {
    const response = await request.get("/items/dummy");
    expect(response.status()).toBe(200);

    const html = await response.text();
    // Static text must be in server HTML
    expect(html).toContain("Dummy Component Demo");
    expect(html).toContain("data-frictionborn-item=\"dummy\"");

    // Rule 1: No opacity: 0 on server HTML elements without data-motion="ok"
    expect(html).not.toMatch(/style="[^"]*opacity:\s*0[^"]*"/);
  });
});
