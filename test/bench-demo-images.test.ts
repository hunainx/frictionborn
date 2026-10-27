// Original — Frictionborn Motion: the bench draws its DistortionImage pictures at test time (the repo ships no media). Every picture
// the harness pages and the specs ask for must be one the generator draws, the bench must run the generator, and what it writes must
// stay out of git. CI's cheap bench failed 6 DistortionImage specs on "ENOENT public/assets/distortion/art-1.webp" before this.
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const root = path.resolve(__dirname, "..");

function filesUnder(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? filesUnder(p) : /\.(ts|tsx)$/.test(e.name) ? [p] : [];
  });
}

describe("bench demo images", () => {
  it("draws every picture the harness and the specs use, at the original sizes", async () => {
    const { DEMO_IMAGES } = await import("../bench/demo-images.ts");
    const names = new Set(DEMO_IMAGES.map((i: { name: string }) => i.name));
    const used = new Set<string>();
    for (const file of [...filesUnder(path.join(root, "bench", "harness", "app")), ...filesUnder(path.join(root, "bench", "specs"))]) {
      for (const m of fs.readFileSync(file, "utf8").matchAll(/assets\/distortion\/([\w.-]+\.webp)/g)) used.add(m[1]);
    }
    expect(used.size).toBeGreaterThan(0);
    for (const name of used) expect(names, `${name} is used by the bench but not drawn`).toContain(name);
    expect(DEMO_IMAGES.find((i: { name: string }) => i.name === "oversized.webp")).toMatchObject({ width: 3000, height: 2000 });
  });

  it("runs before the specs (Playwright global setup)", () => {
    const config = fs.readFileSync(path.join(root, "playwright.config.ts"), "utf8");
    expect(config).toMatch(/globalSetup: "\.\/bench\/global-setup\.ts"/);
    expect(fs.readFileSync(path.join(root, "bench", "global-setup.ts"), "utf8")).toContain("ensureDemoImages(root)");
  });

  it("keeps what it writes out of git", async () => {
    const { demoImageDirs } = await import("../bench/demo-images.ts");
    for (const dir of demoImageDirs(root)) {
      const probe = path.relative(root, path.join(dir, "art-1.webp")).split(path.sep).join("/");
      expect(execSync(`git check-ignore ${probe}`, { cwd: root, encoding: "utf8" }).trim()).toBe(probe);
    }
  });
});
