// Original — Frictionborn Motion copy tone and compliance checker
// Enforces the Frictionborn voice guide (DESIGN.md A7): demos speak about Frictionborn, plain human copy,
// no fake metrics, no sci-fi jargon, no real company/studio/person endorsements.
//
// Matching runs over the whole file (not line by line), so a phrase that wraps onto the next line is still caught.
// Comments are blanked out first. Word lists are deliberately specific: a rule that blocks an ordinary word or a font
// name (for example "Instrument" in "Instrument Serif") would be a false positive, so none of them contains one.

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

interface BannedPattern {
  name: string;
  pattern: RegExp;
  reason: string;
}

export const BANNED_PATTERNS: BannedPattern[] = [
  // 1. Wrong brands / previous fictional brands
  {
    name: "wrong-brand",
    pattern: /\b(Aetheric|Chronos|Kona Acoustics)\b/i,
    reason: "Demos speak about Frictionborn itself (DESIGN.md A7); earlier fictional brands are retired",
  },
  // 2. Sci-fi jargon and fake lab terminology
  {
    name: "sci-fi-jargon",
    pattern:
      /\b(telemetry|metrology|sub-?angstrom|coherence|interferometr\w*|quadrature|quantum|strontium|fountain standard|cesium|doppler|gravimetry|gravitational|picometers?|milli-?hertz|kelvin|allan deviation|laser|satellites?|constellation|orbital|gimbal|optical axis|nd:yag|phase[- ]locked|μrad|test mass|drag-free)\b/i,
    reason: "No sci-fi or developer/HUD tropes in product copy",
  },
  {
    name: "engine-line",
    pattern: /\bEngine:|\bGLSL\b|\bVertex Shaders?\b|\bPoint Primitives\b/i,
    reason: "Status lines state runtime conditions, not engine internals (DESIGN.md A7 rule 4: no 'Engine: GLSL')",
  },
  // 3. Fake / invented metrics and claims
  {
    name: "fake-percentages",
    pattern: /\b\d+(\.\d+)?%\s*(coherence|efficiency|lock|uptime|nominal|faster|reduction|yield)/i,
    reason: "Never invent fabricated percentages or telemetry",
  },
  {
    name: "fake-engineering-metrics",
    pattern: /((?<![\w#.])±?\d+(\.\d+)?\s*(dB|kHz|GHz)\b|DC–\d+(\.\d+)?\s*[kMGT]?Hz|\d+(\.\d+)?\s*pW\/√Hz|\bNIST(-[A-Z0-9]+)?\b|(?<![\w#.])\d+(\.\d+)?\s*(kg|µm|μm|nm)\b)/i,
    reason: "Do not fabricate engineering tolerances, decibel/frequency ratings, weights or NIST standards",
  },
  {
    name: "fake-certification",
    pattern: /\b(certif(y|ies|ied|icate|ication)|calibration certificate|ISO ?\d{4,5})\b/i,
    reason: "Do not invent certificates, certifications or standards compliance",
  },
  {
    name: "comparative-speed-claims",
    pattern: /\b(\d+x\s*faster|\d+\s*times\s*faster|blazing(ly)?\s*fast|revolutionary|cutting-edge|seamless(ly)?)\b/i,
    reason: "No marketing hype or unsubstantiated speed claims",
  },
  {
    name: "hype-words",
    pattern: /\b(zero visual slop|perfectly aligned|pristine|unparalleled|world-class|state-of-the-art|best-in-class|rigorous|non-negotiable)\b/i,
    reason: "No hype words (DESIGN.md A7 rule 2: calm, plain, understated)",
  },
  {
    name: "unearned-verification",
    pattern: /\b(verified on real devices|real physical displays|physical device test passes)\b/i,
    reason: "Real-device results are pending (TASKS step 12); do not claim them",
  },
  // 4. Real recording studios and music/audio facilities (legal endorsement risk)
  {
    name: "real-studios",
    pattern: /\b(Abbey Road|Capitol Studios|Electric Lady|AIR Studios|Metropolis Studios|Galaxy Studios|Sound City|Henson Recording|Sterling Sound|Record Plant|Sunset Sound|Power Station Studios?)\b/i,
    reason: "Real studio names presented as clients create legal risk",
  },
  // 5. Real companies, audio brands, and agencies
  {
    name: "real-brands",
    pattern: /\b(Sennheiser|Neumann|Genelec|Bose|Bang & Olufsen|Bowers & Wilkins|Shure|Dolby|Sony Music|Universal Music|Warner Music|Spotify|Apple Music)\b/i,
    reason: "Do not use real corporate or audio brand names",
  },
  // 6. Real artists and museum names (owner decision 2026-10-06)
  {
    name: "real-artists-museums",
    pattern: /(?:\b(Vincent van Gogh|van Gogh|Hokusai|Katsushika Hokusai|Pierre Puvis de Chavannes|Puvis de Chavannes|The Metropolitan Museum of Art|Metropolitan Museum of Art)\b|\bThe Met\b)/i,
    reason: "Use original generated images or CC0 images with plain captions in DESIGN.md voice; no real artist or museum names",
  },
];

const ROOT = process.cwd();
const TARGET_DIRS = [
  path.join(ROOT, "registry", "items"),
  path.join(ROOT, "bench", "harness", "app"),
  path.join(ROOT, "apps", "docs", "app"),
  path.join(ROOT, "apps", "docs", "components"),
  path.join(ROOT, "apps", "docs", "lib"),
];

interface Violation {
  file: string;
  line: number;
  patternName: string;
  matchedText: string;
  reason: string;
}

/** Replaces comments with blanks of the same length, so offsets and line numbers still match. */
function blankComments(text: string): string {
  const blank = (m: string) => m.replace(/[^\n]/g, " ");
  return text
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/(^|[\s;{}(),])\/\/[^\n]*/g, (m, lead) => lead + blank(m.slice(lead.length)));
}

/** Files whose text is shown to people: demos, compositions, harness pages and the docs site (tsx and ts). */
function isCopyFile(relativePath: string): boolean {
  const p = relativePath.split(path.sep).join("/");
  if (!/\.(tsx|ts)$/.test(p)) return false;
  if (/\.test\.tsx?$/.test(p)) return false;
  const base = path.basename(p);
  if (base === "demo.tsx" || base === "ambient-hero.tsx" || base === "scroll-showcase.tsx") return true;
  if (p.startsWith("bench/harness/app/")) return /\.tsx$/.test(p);
  if (p.startsWith("the-private-website-repo/")) return !/^apps\/docs\/(\.next|node_modules)\//.test(p);
  return false;
}

export function scanText(relativePath: string, content: string): Violation[] {
  const violations: Violation[] = [];
  const text = blankComments(content);
  for (const rule of BANNED_PATTERNS) {
    const re = new RegExp(rule.pattern.source, rule.pattern.flags.includes("g") ? rule.pattern.flags : rule.pattern.flags + "g");
    for (const match of text.matchAll(re)) {
      const line = text.slice(0, match.index).split("\n").length;
      violations.push({
        file: relativePath,
        line,
        patternName: rule.name,
        matchedText: match[0].replace(/\s+/g, " "),
        reason: rule.reason,
      });
    }
  }
  return violations.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
}

export function checkCopy(rev?: string): Violation[] {
  const violations: Violation[] = [];

  if (rev) {
    try {
      const output = execSync(`git ls-tree -r --name-only ${rev}`, { encoding: "utf8" });
      const files = output.split("\n").map((f) => f.trim()).filter(Boolean);
      for (const file of files) {
        if (!isCopyFile(file)) continue;
        try {
          const content = execSync(`git show ${rev}:${file}`, { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
          violations.push(...scanText(file, content));
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
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === "node_modules" || entry.name === ".next") continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.isFile()) {
        const rel = path.relative(ROOT, fullPath);
        if (!isCopyFile(rel)) continue;
        violations.push(...scanText(rel, fs.readFileSync(fullPath, "utf8")));
      }
    }
  }

  for (const dir of TARGET_DIRS) scanDir(dir);
  return violations;
}

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
    console.error(`\nPlease rewrite copy to match the Frictionborn voice guide in DESIGN.md.\n`);
    process.exit(1);
  } else {
    console.log(`✔ Copy check passed: All demos, compositions and docs pages adhere to the Frictionborn voice guide${rev ? ` at ${rev}` : ""}.`);
  }
}
