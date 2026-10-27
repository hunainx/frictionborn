// Original — Frictionborn Motion: the bench harness must define every shadcn host token the demos read (AGENTS lesson 4), in its
// dark root and its light theme. A missing one sent a demo to its system-colour fallback, which does not follow the harness theme:
// match-progress drew light text on white Canvas (1.19:1, Linux) and eclipse-switch/temper-slider GrayText on dark (3.43:1, Windows),
// failing the bench's axe spec.
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "..");
const SHADCN_TOKENS = [
  "background", "foreground", "card", "card-foreground", "popover", "popover-foreground", "primary", "primary-foreground",
  "secondary", "secondary-foreground", "muted", "muted-foreground", "accent", "accent-foreground", "destructive", "border", "input", "ring",
];

function block(css: string, selector: RegExp): string {
  const m = selector.exec(css);
  if (!m) return "";
  return css.slice(m.index, css.indexOf("}", m.index));
}

describe("bench harness host tokens", () => {
  it("defines, in dark and light, every shadcn token a demo reads", () => {
    const itemsDir = path.join(root, "registry", "items");
    const used = new Set<string>();
    for (const name of fs.readdirSync(itemsDir)) {
      const demo = path.join(itemsDir, name, "demo.tsx");
      if (!fs.existsSync(demo)) continue;
      for (const m of fs.readFileSync(demo, "utf8").matchAll(/var\(--([a-z-]+)/g)) if (SHADCN_TOKENS.includes(m[1])) used.add(m[1]);
    }
    expect(used.size).toBeGreaterThan(0);
    const css = fs.readFileSync(path.join(root, "bench", "harness", "app", "globals.css"), "utf8");
    const dark = block(css, /^:root \{/m);
    const light = block(css, /^html\.light, html\[data-theme="light"\] \{/m);
    for (const token of used) {
      expect(dark, `--${token} in :root`).toMatch(new RegExp(`^\\s*--${token}:`, "m"));
      expect(light, `--${token} in the light theme`).toMatch(new RegExp(`^\\s*--${token}:`, "m"));
    }
  });
});
