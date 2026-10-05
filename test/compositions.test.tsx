// Original — audit M4: composition rules (Decision 29/30) and the API fixes that had no test.
// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import React from "react";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { render, cleanup } from "@testing-library/react";
import { ScrollShowcase } from "../registry/items/scroll-showcase/scroll-showcase";
import { AmbientHero } from "../registry/items/ambient-hero/ambient-hero";

const root = path.resolve(__dirname, "..");
const steps = [{ id: "a", title: "Step title", description: "Step text", media: { content: <div>media</div> } }];

afterEach(() => cleanup());

describe("compositions: content props are required in TypeScript (Decision 29)", () => {
  it("tsc fails when a required content prop is omitted, and passes when they are all given", () => {
    const tsc = path.join(root, "node_modules", "typescript", "bin", "tsc");
    // exit 0 means: the valid usages compile AND every @ts-expect-error in the fixture is a real error
    expect(() => execFileSync(process.execPath, [tsc, "-p", "test/types/tsconfig.json"], { cwd: root, stdio: "pipe" })).not.toThrow();
  });
});

describe("compositions: no demo copy, no colours, no shared ids inside the components", () => {
  const sources = ["ambient-hero/ambient-hero.tsx", "scroll-showcase/scroll-showcase.tsx"].map(
    (f) => [f, fs.readFileSync(path.join(root, "registry", "items", f), "utf8")] as const
  );

  it("component files contain no brand/demo copy", () => {
    for (const [file, src] of sources) {
      for (const phrase of ["Laboratory", "Measured Tolerances", "Reference deployments", "architecture", "Studio Series", "aluminum", "listening"]) {
        expect(src.includes(phrase), `${file} contains "${phrase}"`).toBe(false);
      }
    }
  });

  it("no shipped item file hard-codes a colour (hex, rgb(), hsl()) or a docs-only / non-shadcn token", () => {
    const dir = path.join(root, "registry", "items");
    const files = fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .flatMap((d) =>
        fs
          .readdirSync(path.join(dir, d.name))
          .filter((f) => /\.tsx$/.test(f) && f !== "demo.tsx")
          .map((f) => path.join(dir, d.name, f))
      );
    expect(files.length).toBeGreaterThan(10);
    for (const f of files) {
      const src = fs.readFileSync(f, "utf8");
      expect(/#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/.test(src), `${path.basename(f)} hard-codes a colour`).toBe(false);
      expect(/--(signal|ink|line|surface|warning)\b/.test(src), `${path.basename(f)} uses a docs-only or non-shadcn token`).toBe(false);
    }
  });

  it("two ScrollShowcase sections on one page share no id and each label points at its own heading", () => {
    const { container } = render(
      <>
        <ScrollShowcase headline="One" description="d" steps={steps} specs={[{ metric: "1", label: "L", detail: "x" }]} specsHeading="Specs one" />
        <ScrollShowcase headline="Two" description="d" steps={steps} specs={[{ metric: "1", label: "L", detail: "x" }]} specsHeading="Specs two" />
      </>
    );
    const ids = Array.from(container.querySelectorAll("[id]")).map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const el of Array.from(container.querySelectorAll("[aria-labelledby]"))) {
      const target = container.querySelector(`[id="${el.getAttribute("aria-labelledby")}"]`);
      expect(target, "aria-labelledby points at a missing element").not.toBeNull();
    }
    const sections = Array.from(container.querySelectorAll("section[aria-labelledby]"));
    const names = sections.map((s) => container.querySelector(`[id="${s.getAttribute("aria-labelledby")}"]`)?.textContent);
    expect(names).toContain("One");
    expect(names).toContain("Two");
  });

  it("with only the required props, ScrollShowcase renders no heading, label or marquee copy of its own", () => {
    const { container } = render(<ScrollShowcase headline="Only this" description="And this" steps={steps} marqueeItems={["Item"]} />);
    expect(container.querySelector("h3")).toBeNull();
    expect(container.querySelector("section[aria-label]")).toBeNull();
    expect(container.textContent).not.toMatch(/Laboratory|Tolerances|Reference deployments/);
  });

  it("compositions forward `nonce` to every <style> they render", () => {
    const { container } = render(
      <>
        <ScrollShowcase headline="h" description="d" steps={steps} marqueeItems={["x"]} specs={[{ metric: "1", label: "L", detail: "x" }]} nonce="n-123" />
        <AmbientHero headline="Hero" body="b" primaryCta={{ label: "Go", href: "/" }} nonce="n-123" />
      </>
    );
    const styles = Array.from(container.querySelectorAll("style"));
    expect(styles.length).toBeGreaterThan(3);
    for (const s of styles) expect(s.getAttribute("nonce"), "a <style> without the nonce").toBe("n-123");
  });
});
