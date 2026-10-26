// Original — Frictionborn Motion copy tone and compliance checker
// Enforces the Frictionborn voice guide (DESIGN.md A7): demos speak about Frictionborn, plain human copy,
// no fake metrics, no sci-fi jargon, no real company/studio/person endorsements.
//
// Matching runs over the whole file (not line by line), so a phrase that wraps onto the next line is still caught.
// Comments are blanked out first. Word lists are deliberately specific: a rule that blocks an ordinary word or a font
// name (for example "Instrument" in "Instrument Serif") would be a false positive, so none of them contains one.

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
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
  // 7. Internal prototype notes, slot instructions, and placeholder captions
  {
    name: "internal-slot-or-preview",
    pattern: /(?:\bSlot:|\bPlaceholder\b|Concept preview|we discussed|goes here|to be reviewed by|once configured|first-fire-photo\.jpg|first-fire-man\.glb)/,
    reason: "No internal prototype notes, reviewer notes, slot filenames, or placeholder captions may appear in visitor-facing code",
  },
];

const ROOT = process.cwd();
const TARGET_DIRS = [
  path.join(ROOT, "registry", "items"),
  path.join(ROOT, "bench", "harness", "app"),
  path.join(ROOT, "apps", "docs", "app"),
  path.join(ROOT, "apps", "docs", "components"),
  path.join(ROOT, "apps", "docs", "lib"),
  // round 4: the studio's content (services, work, reviews, founders)
  path.join(ROOT, "apps", "docs", "content"),
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
  return false;
}

export function scanText(relativePath: string, content: string): Violation[] {
  const violations: Violation[] = [];
  const text = blankComments(content);
  const normalizedPath = relativePath.split(path.sep).join("/");
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

export const BANNED_AGENCY_HASHES: ReadonlySet<string> = new Set([
  "457558efe5e0c689171d6cfc65949908b4cd3366f52833bff19bfe2a03f35b33",
  "497c2149a54fe6eb26f09a471a3029aea268d202f937acb5fa8262a1706f2040",
]);

export interface BannedHashMatch {
  source: string;
  kind: "token" | "pair";
  hash: string;
}

export interface BannedHashScanResult {
  tokensScanned: number;
  pairsScanned: number;
  matches: BannedHashMatch[];
}

const sha256Cache = new Map<string, string>();
const safeDefaultSet = new Set<string>();
function sha256Hex(value: string): string {
  let cached = sha256Cache.get(value);
  if (!cached) {
    cached = crypto.createHash("sha256").update(value).digest("hex");
    if (sha256Cache.size < 100000) sha256Cache.set(value, cached);
  }
  return cached;
}
function checkTokenOrPair(value: string, bannedHashes: ReadonlySet<string>): string | null {
  const isDefault = bannedHashes === BANNED_AGENCY_HASHES;
  if (isDefault) {
    if (value.length < 4 || value.length > 32) return null;
    for (let i = 0; i < value.length; i++) {
      const c = value.charCodeAt(i);
      if (c < 97 || c > 122) return null;
    }
    if (safeDefaultSet.has(value)) return null;
  }
  const h = sha256Hex(value);
  if (bannedHashes.has(h)) return h;
  if (isDefault && safeDefaultSet.size < 500000) safeDefaultSet.add(value);
  return null;
}

/**
 * Lowercases all input text, splits on non-alphanumeric characters, and SHA-256 hashes
 * every token and every pair of adjacent tokens joined with no space.
 * Never logs or stores plaintext tokens in matches.
 */
export function scanTextsForBannedHashes(
  entries: ReadonlyArray<{ source: string; text: string }>,
  bannedHashes: ReadonlySet<string> = BANNED_AGENCY_HASHES,
): BannedHashScanResult {
  let tokensScanned = 0;
  let pairsScanned = 0;
  const matches: BannedHashMatch[] = [];

  for (const { source, text } of entries) {
    const tokens = text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
    tokensScanned += tokens.length;
    for (let i = 0; i < tokens.length; i++) {
      const tokenHit = checkTokenOrPair(tokens[i], bannedHashes);
      if (tokenHit) {
        matches.push({ source, kind: "token", hash: tokenHit });
      }
      if (i + 1 < tokens.length) {
        pairsScanned++;
        const pairHit = checkTokenOrPair(tokens[i] + tokens[i + 1], bannedHashes);
        if (pairHit) {
          matches.push({ source, kind: "pair", hash: pairHit });
        }
      }
    }
  }

  return { tokensScanned, pairsScanned, matches };
}

/**
 * Collects all built text across HTML, JS, JSON-LD, llms.txt, public/r, skills/, docs pages,
 * and share-image alt text, plus any live-fetched route HTML entries passed in.
 */
export function collectBuiltTextEntries(
  rootDir: string = ROOT,
  extraEntries: ReadonlyArray<{ source: string; text: string }> = [],
): Array<{ source: string; text: string }> {
  const entries: Array<{ source: string; text: string }> = [...extraEntries];
  const seenFiles = new Set<string>();

  const addFile = (fullPath: string) => {
    const resolved = path.resolve(fullPath);
    if (seenFiles.has(resolved)) return;
    try {
      if (!fs.existsSync(resolved)) return;
      const text = fs.readFileSync(resolved, "utf8");
      seenFiles.add(resolved);
      const rel = path.relative(rootDir, resolved).split(path.sep).join("/");
      entries.push({ source: rel, text });
    } catch {
      // Ignore transient files removed or locked by a concurrent build
    }
  };

  const walkDir = (dir: string, extRe: RegExp, skipNft = false) => {
    let list: fs.Dirent[];
    try {
      if (!fs.existsSync(dir)) return;
      list = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of list) {
      if (entry.name === "node_modules" || entry.name === ".next" || entry.name === "cache" || entry.name === "diagnostics" || entry.name === "route-cache") {
        continue;
      }
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walkDir(full, extRe, skipNft);
      } else if (entry.isFile()) {
        if (skipNft && entry.name.endsWith(".nft.json")) continue;
        if (extRe.test(entry.name)) addFile(full);
      }
    }
  };

  // Built Next.js server & static HTML, JS, JSON, RSC
  walkDir(path.join(rootDir, "apps", "docs", ".next", "server"), /\.(html|js|mjs|json|txt|rsc)$/i, true);
  walkDir(path.join(rootDir, "apps", "docs", ".next", "static"), /\.(html|js|mjs|json|txt)$/i, true);

  // llms.txt files
  for (const rel of ["llms.txt", "public/llms.txt", "public/r/llms.txt"]) {
    addFile(path.join(rootDir, rel));
  }

  // public/r registry outputs (.json, .md)
  walkDir(path.join(rootDir, "public", "r"), /\.(json|md|txt)$/i);
  walkDir(path.join(rootDir, "apps", "docs", "public", "r"), /\.(json|md|txt)$/i);

  // skills/
  walkDir(path.join(rootDir, "skills"), /\.(md|json|txt|ts|tsx)$/i);

  // docs pages, JSON-LD, and share-image alt text
  walkDir(path.join(rootDir, "apps", "docs", "app"), /\.(tsx|ts|md|mdx|json|txt)$/i);
  walkDir(path.join(rootDir, "apps", "docs", "components"), /\.(tsx|ts|md|mdx)$/i);
  walkDir(path.join(rootDir, "apps", "docs", "content"), /\.(tsx|ts|md|json)$/i);
  walkDir(path.join(rootDir, "apps", "docs", "lib", "docs"), /\.(tsx|ts|md|json)$/i);
  walkDir(path.join(rootDir, "apps", "docs", "lib", "site"), /\.(tsx|ts|md|json)$/i);

  return entries;
}

// CLI execution
const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const revArgIdx = process.argv.indexOf("--rev");
  const rev = revArgIdx !== -1 ? process.argv[revArgIdx + 1] : undefined;
  const violations = checkCopy(rev);
  const hashScan = rev ? { tokensScanned: 0, pairsScanned: 0, matches: [] } : scanTextsForBannedHashes(collectBuiltTextEntries(ROOT));
  if (violations.length > 0 || hashScan.matches.length > 0) {
    if (violations.length > 0) {
      console.error(`\n❌ Found ${violations.length} copy violation(s) violating DESIGN.md A7 voice guide${rev ? ` at ${rev}` : ""}:\n`);
      for (const v of violations) {
        console.error(`  ${v.file}:${v.line} [${v.patternName}] Found "${v.matchedText}" — ${v.reason}`);
      }
    }
    if (hashScan.matches.length > 0) {
      console.error(`\n❌ Found ${hashScan.matches.length} banned agency hash match(es):\n`);
      for (const m of hashScan.matches) {
        console.error(`  ${m.source} [${m.kind}] hash=${m.hash}`);
      }
    }
    console.error(`\nPlease rewrite copy to match the Frictionborn voice guide in DESIGN.md.\n`);
    process.exit(1);
  } else {
    console.log(
      `✔ Copy check passed: All demos, compositions and docs pages adhere to the Frictionborn voice guide${rev ? ` at ${rev}` : ""}${
        !rev ? ` (${hashScan.tokensScanned} tokens scanned, 0 banned hash matches)` : ""
      }.`,
    );
  }
}
