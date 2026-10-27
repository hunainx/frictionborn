// Original — Frictionborn Motion: the install smoke test and the fresh-apps check must take only registry items from public/r.
// In the library repository scripts/build-sizes.ts writes public/r/performance-sizes.json (an array), and both checks failed on it
// ("Expected object, received array"; "performance-sizes.json is missing 'meta' field").
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const root = path.resolve(__dirname, "..");

describe("registry item files in public/r", () => {
  it("skips the registry index and the size report", async () => {
    const { registryItemFiles } = await import("../scripts/registry-items.ts");
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "fb-registry-items-"));
    try {
      const item = (name: string) => ({ $schema: "https://ui.shadcn.com/schema/registry-item.json", name, meta: {} });
      fs.writeFileSync(path.join(dir, "flint-button.json"), JSON.stringify(item("flint-button")));
      fs.writeFileSync(path.join(dir, "ash-text.json"), JSON.stringify(item("ash-text")));
      fs.writeFileSync(path.join(dir, "ash-text.md"), "# ash-text");
      fs.writeFileSync(path.join(dir, "index.json"), JSON.stringify({ $schema: "https://ui.shadcn.com/schema/registry.json", items: [] }));
      fs.writeFileSync(path.join(dir, "performance-sizes.json"), JSON.stringify([{ name: "ash-text", sizeKB: 1 }]));
      expect(registryItemFiles(dir)).toEqual(["ash-text.json", "flint-button.json"]);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("is the one list the smoke test and the fresh-apps check use", () => {
    for (const script of ["smoke-install.ts", "fresh-apps.ts"]) {
      const src = fs.readFileSync(path.join(root, "scripts", script), "utf8");
      expect(src, script).toContain('import { registryItemFiles } from "./registry-items.ts";');
      expect(src, script).not.toMatch(/readdirSync\(publicRDir\)/);
    }
  });
});
