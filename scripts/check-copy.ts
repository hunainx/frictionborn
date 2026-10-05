// Original — Frictionborn Motion copy tone and compliance checker
// Enforces DESIGN.md A7 voice guide: Kona Acoustics, plain human copy,
// no fake metrics, no sci-fi jargon, no real company/studio/person endorsements.

import fs from "node:fs";
import path from "node:path";

interface BannedPattern {
  name: string;
  pattern: RegExp;
  reason: string;
}

const BANNED_PATTERNS: BannedPattern[] = [
  // 1. Wrong brands / previous fictional brands
  {
    name: "wrong-brand",
    pattern: /\b(Aetheric|Chronos)\b/i,
    reason: "Use only 'Kona Acoustics' as the fictional brand per DESIGN.md A7",
  },
  // 2. Sci-fi jargon and fake lab terminology
  {
    name: "sci-fi-jargon",
    pattern: /\b(telemetry|metrology|sub-angstrom|coherence|interferometry|interferometer|quadrature|quantum|strontium|fountain standard|cesium|doppler)\b/i,
    reason: "No sci-fi or developer/HUD tropes in product copy",
  },
  // 3. Fake / invented metrics and claims
  {
    name: "fake-percentages",
    pattern: /\b\d+(\.\d+)?%\s*(coherence|efficiency|lock|uptime|nominal|faster|reduction|yield)/i,
    reason: "Never invent fabricated percentages or telemetry",
  },
  {
    name: "fake-engineering-metrics",
    pattern: /\b(±?\d+(\.\d+)?\s*dB|DC–\d+(\.\d+)?\s*[kMGT]?Hz|\d+(\.\d+)?\s*pW\/√Hz|NIST(-[A-Z0-9]+)?)\b/i,
    reason: "Do not fabricate engineering tolerances, decibel ratings, or NIST standards",
  },
  {
    name: "comparative-speed-claims",
    pattern: /\b(\d+x\s*faster|\d+\s*times\s*faster|blazing(ly)?\s*fast|revolutionary|cutting-edge|seamless(ly)?)\b/i,
    reason: "No marketing hype or unsubstantiated speed claims",
  },
  // 4. Real recording studios and music/audio facilities (legal endorsement risk)
  {
    name: "real-studios",
    pattern: /\b(Abbey Road|Capitol Studios|Electric Lady|AIR Studios|Metropolis Studios|Galaxy Studios|Sound City|Henson Recording|Sterling Sound|Record Plant|Sunset Sound|Power Station)\b/i,
    reason: "Real studio names presented as clients create legal risk",
  },
  // 5. Real companies, audio brands, and agencies
  {
    name: "real-brands",
    pattern: /\b(Sennheiser|Neumann|Genelec|Bose|Bang & Olufsen|Bowers & Wilkins|Shure|Dolby|Sony Music|Universal Music|Warner Music|Spotify|Apple Music)\b/i,
    reason: "Do not use real corporate or audio brand names",
  },
];

const ROOT = process.cwd();
const TARGET_DIRS = [
  path.join(ROOT, "registry", "items"),
  path.join(ROOT, "bench", "harness", "app"),
];

interface Violation {
  file: string;
  line: number;
  patternName: string;
  matchedText: string;
  reason: string;
}

import { execSync } from "node:child_process";

export function checkCopy(rev?: string): Violation[] {
  const violations: Violation[] = [];

  function checkContent(relativePath: string, content: string) {
    const lines = content.split("\n");
    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*")) return;

      for (const rule of BANNED_PATTERNS) {
        const match = line.match(rule.pattern);
        if (match) {
          violations.push({
            file: relativePath,
            line: idx + 1,
            patternName: rule.name,
            matchedText: match[0],
            reason: rule.reason,
          });
        }
      }
    });
  }

  if (rev) {
    try {
      const output = execSync(`git ls-tree -r --name-only ${rev}`, { encoding: "utf8" });
      const files = output.split("\n").map(f => f.trim()).filter(Boolean);
      for (const file of files) {
        const isDemo = path.basename(file) === "demo.tsx";
        const isComposition = file.endsWith("ambient-hero.tsx") || file.endsWith("scroll-showcase.tsx");
        const isHarnessPage = file.startsWith("bench/harness/app/") && file.endsWith(".tsx");
        if (!isDemo && !isComposition && !isHarnessPage) continue;

        try {
          const content = execSync(`git show ${rev}:${file}`, { encoding: "utf8" });
          checkContent(file, content);
        } catch {
          // Ignore files not found in git
        }
      }
    } catch (e) {
      console.error(`Failed to scan git rev ${rev}:`, e);
    }
    return violations;
  }

  function scanDir(dir: string) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.isFile() && (entry.name === "demo.tsx" || entry.name.endsWith(".tsx"))) {
        const isDemo = entry.name === "demo.tsx";
        const isComposition = entry.name === "ambient-hero.tsx" || entry.name === "scroll-showcase.tsx";
        const isHarnessPage = fullPath.includes("bench" + path.sep + "harness" + path.sep + "app");
        if (!isDemo && !isComposition && !isHarnessPage) continue;

        const content = fs.readFileSync(fullPath, "utf8");
        checkContent(path.relative(ROOT, fullPath), content);
      }
    }
  }

  for (const dir of TARGET_DIRS) {
    scanDir(dir);
  }

  return violations;
}

import { fileURLToPath } from "node:url";

// CLI execution
const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const revArgIdx = process.argv.indexOf("--rev");
  const rev = revArgIdx !== -1 ? process.argv[revArgIdx + 1] : undefined;
  const violations = checkCopy(rev);
  if (violations.length > 0) {
    console.error(`\n❌ Found ${violations.length} copy violation(s) violating DESIGN.md A7 voice guide${rev ? ` at ${rev}` : ""}:\n`);
    for (const v of violations) {
      console.error(`  ${v.file}:${v.line} [${v.patternName}] Found "${v.matchedText}" — ${v.reason}`);
    }
    console.error(`\nPlease rewrite copy to match Kona Acoustics voice guide in DESIGN.md.\n`);
    process.exit(1);
  } else {
    console.log(`✔ Copy check passed: All demos and compositions adhere to Kona Acoustics voice guide${rev ? ` at ${rev}` : ""}.`);
  }
}
