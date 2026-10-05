// Original — Frictionborn Motion check-shipped-code
// Ensures benchmark hooks, test toggles, and harness-only branches never ship in registry items.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = process.cwd();
const ITEMS_DIR = path.join(ROOT, "registry", "items");

const BANNED_SHIPPED_PATTERNS: Array<{ name: string; pattern: RegExp; reason: string }> = [
  {
    name: "leak-hook",
    pattern: /leak=1/,
    reason: "Benchmark leak=1 hook must live only in bench harness, not in shipped components",
  },
  {
    name: "deferDpr-hook",
    pattern: /\bdeferDpr\b/,
    reason: "deferDpr test toggle must not be present in shipped items",
  },
  {
    name: "location-search",
    pattern: /location\.search/,
    reason: "Query parameter parsing for test branches must not appear in shipped components",
  },
  {
    name: "harness-globals",
    pattern: /__fbCapture|__fbResults|__fbCtx/,
    reason: "Harness test hooks must not appear in shipped items",
  },
];

interface Violation {
  file: string;
  line: number;
  patternName: string;
  matchedText: string;
  reason: string;
}

export function checkShippedCode(): Violation[] {
  const violations: Violation[] = [];

  function scan(dir: string) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scan(full);
      } else if (entry.isFile() && (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts"))) {
        // demo.tsx is a registry demo, but core components (*.tsx excluding demo.tsx) must be 100% clean
        const isCoreComponent = !entry.name.endsWith(".test.tsx") && !entry.name.endsWith(".fixture.tsx");
        if (!isCoreComponent) continue;

        const content = fs.readFileSync(full, "utf8");
        const lines = content.split("\n");
        lines.forEach((line, idx) => {
          const trimmed = line.trim();
          if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*")) return;

          for (const rule of BANNED_SHIPPED_PATTERNS) {
            const match = line.match(rule.pattern);
            if (match) {
              violations.push({
                file: path.relative(ROOT, full),
                line: idx + 1,
                patternName: rule.name,
                matchedText: match[0],
                reason: rule.reason,
              });
            }
          }
        });
      }
    }
  }

  scan(ITEMS_DIR);
  return violations;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const violations = checkShippedCode();
  if (violations.length > 0) {
    console.error(`\n❌ Found ${violations.length} forbidden test hooks in shipped registry items:\n`);
    for (const v of violations) {
      console.error(`  ${v.file}:${v.line} [${v.patternName}] Found "${v.matchedText}" — ${v.reason}`);
    }
    process.exit(1);
  } else {
    console.log("✔ Shipped code check passed: 0 benchmark hooks or test toggles in registry items.");
  }
}
