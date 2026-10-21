// Original — Frictionborn Motion evidence merger
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { measureItemSize } from "../bench/size/measure.ts";

export interface MergeResult {
  item: string;
  merged: boolean;
  errors: string[];
}

export const PROJECT_LABELS: Record<string, string> = {
  "chromium-desktop": "Chromium Desktop (SwiftShader)",
  "chromium-mobile": "Chromium Mobile (Pixel 7 emulation)",
  "firefox-desktop": "Firefox Desktop",
  "webkit-desktop": "WebKit Desktop",
  "webkit-mobile": "WebKit Mobile (iPhone 14 emulation)",
};

export function hashRawResultsText(rawText: string): string {
  return crypto.createHash("sha256").update(rawText.replace(/\r\n/g, "\n"), "utf8").digest("hex");
}

export interface RawProbeData {
  cls?: number;
  framesWhenIdle?: { offscreen?: number; hiddenTab?: number; reducedMotion?: number };
  axe?: { serious?: number; critical?: number };
  data?: RawProbeData;
}

export interface RawResultsInput {
  date?: string;
  probes?: RawProbeData[];
  playwright?: {
    specs?: Array<{ file?: string; title?: string; projectName?: string; status?: string }>;
    projects?: Record<string, { passed?: number; failed?: number; flaky?: number }>;
  };
}

export function recomputeFromRawResults(
  raw: RawResultsInput | null | undefined,
  fallbackDate?: string
): {
  cls: number;
  framesWhenIdle: { offscreen: number; hiddenTab: number; reducedMotion: number };
  axe: { serious: number; critical: number };
  devices: Array<{ env: string; via: "playwright"; tier: number; result: "pass" | "fail"; date: string; notes: string }>;
} | null {
  if (!raw || typeof raw !== "object") return null;
  const date = typeof raw.date === "string" ? raw.date : fallbackDate || "";
  let measuredCls = 0;
  let offscreenFrames: number | null = null;
  let hiddenTabFrames: number | null = null;
  let reducedMotionFrames: number | null = null;
  let axeSerious: number | null = null;
  let axeCritical: number | null = null;

  const probes = Array.isArray(raw.probes) ? raw.probes : [];
  for (const entry of probes) {
    const rawContent = entry?.data ?? entry;
    if (!rawContent || typeof rawContent !== "object") continue;
    if (typeof rawContent.cls === "number") {
      measuredCls = Math.max(measuredCls, rawContent.cls);
    }
    if (rawContent.framesWhenIdle) {
      if (typeof rawContent.framesWhenIdle.offscreen === "number") {
        offscreenFrames = Math.max(offscreenFrames ?? 0, rawContent.framesWhenIdle.offscreen);
      }
      if (typeof rawContent.framesWhenIdle.hiddenTab === "number") {
        hiddenTabFrames = Math.max(hiddenTabFrames ?? 0, rawContent.framesWhenIdle.hiddenTab);
      }
      if (typeof rawContent.framesWhenIdle.reducedMotion === "number") {
        reducedMotionFrames = Math.max(reducedMotionFrames ?? 0, rawContent.framesWhenIdle.reducedMotion);
      }
    }
    if (rawContent.axe) {
      if (typeof rawContent.axe.serious === "number") {
        axeSerious = Math.max(axeSerious ?? 0, rawContent.axe.serious);
      }
      if (typeof rawContent.axe.critical === "number") {
        axeCritical = Math.max(axeCritical ?? 0, rawContent.axe.critical);
      }
    }
  }

  if (
    offscreenFrames === null ||
    hiddenTabFrames === null ||
    reducedMotionFrames === null ||
    axeSerious === null ||
    axeCritical === null
  ) {
    return null;
  }

  const projectResults = new Map<string, { passed: number; failed: number; flaky: number }>();
  const specs = Array.isArray(raw.playwright?.specs) ? raw.playwright.specs : null;
  if (specs && specs.length > 0) {
    for (const s of specs) {
      if (!s || typeof s.projectName !== "string") continue;
      const entry = projectResults.get(s.projectName) ?? { passed: 0, failed: 0, flaky: 0 };
      if (s.status === "expected") entry.passed++;
      else if (s.status === "flaky") entry.flaky++;
      else if (s.status !== "skipped") entry.failed++;
      projectResults.set(s.projectName, entry);
    }
  } else if (raw.playwright?.projects && typeof raw.playwright.projects === "object") {
    for (const [proj, counts] of Object.entries(raw.playwright.projects)) {
      projectResults.set(proj, {
        passed: Number(counts.passed ?? 0),
        failed: Number(counts.failed ?? 0),
        flaky: Number(counts.flaky ?? 0),
      });
    }
  } else {
    return null;
  }

  const devices = Array.from(projectResults.entries()).map(([project, r]) => ({
    env: PROJECT_LABELS[project] ?? project,
    via: "playwright" as const,
    tier: project.includes("mobile") ? 2 : 3,
    result: (r.failed === 0 ? "pass" : "fail") as "pass" | "fail",
    date,
    notes: `${r.passed} passed, ${r.failed} failed${r.flaky ? `, ${r.flaky} flaky (passed on retry)` : ""}`,
  }));

  return {
    cls: measuredCls,
    framesWhenIdle: {
      offscreen: offscreenFrames,
      hiddenTab: hiddenTabFrames,
      reducedMotion: reducedMotionFrames,
    },
    axe: {
      serious: axeSerious,
      critical: axeCritical,
    },
    devices,
  };
}

export function validateMeasuredAgainstDeclared(declared: any, measured: any, itemName: string): string[] {
  const errors: string[] = [];

  // Required measured fields
  if (!measured.commit || typeof measured.commit !== "string") {
    errors.push(`[${itemName}] measured.commit is required`);
  }
  if (!measured.date || typeof measured.date !== "string") {
    errors.push(`[${itemName}] measured.date is required`);
  }
  if (measured.treeClean !== undefined && measured.treeClean !== true) {
    errors.push(`[${itemName}] measured.treeClean must be true (bench:release must run on a clean working tree)`);
  }
  if (!measured.sizeKB || typeof measured.sizeKB.initial !== "number") {
    errors.push(`[${itemName}] measured.sizeKB.initial must be a number`);
  }
  if (typeof measured.cls !== "number") {
    errors.push(`[${itemName}] measured.cls must be a number`);
  }
  if (!measured.framesWhenIdle) {
    errors.push(`[${itemName}] measured.framesWhenIdle object is required`);
  }
  if (!measured.axe || typeof measured.axe.serious !== "number" || typeof measured.axe.critical !== "number") {
    errors.push(`[${itemName}] measured.axe with serious and critical counts is required`);
  }

  // Contradiction checks per TESTING.md and ARCHITECTURE.md
  // 1. Accessibility: 0 serious / critical
  if (measured.axe && (measured.axe.serious > 0 || measured.axe.critical > 0)) {
    errors.push(
      `[${itemName}] Contradiction: axe-core detected ${measured.axe.serious} serious and ${measured.axe.critical} critical violations (must be 0)`
    );
  }

  // 2. Idle frames: 0 off-screen / hidden / reduced motion when declared static/off
  if (measured.framesWhenIdle) {
    if (declared.behavior?.loop === "none" && measured.framesWhenIdle.offscreen > 0) {
      errors.push(
        `[${itemName}] Contradiction: loop is declared 'none', but bench measured ${measured.framesWhenIdle.offscreen} off-screen frames`
      );
    }
    const rmMode = declared.behavior?.reducedMotion?.mode;
    if ((rmMode === "static" || rmMode === "off") && measured.framesWhenIdle.reducedMotion > 0) {
      errors.push(
        `[${itemName}] Contradiction: reducedMotion mode is '${rmMode}', but bench measured ${measured.framesWhenIdle.reducedMotion} frames during reduced-motion`
      );
    }
    if (measured.framesWhenIdle.hiddenTab > 0) {
      errors.push(
        `[${itemName}] Contradiction: hiddenTab must have 0 frames, but bench measured ${measured.framesWhenIdle.hiddenTab} frames`
      );
    }
  }

  // 2b. A recorded failing environment is not "verified" evidence (the merge used to accept `result: "fail"`).
  if (!Array.isArray(measured.devices) || measured.devices.length === 0) {
    errors.push(`[${itemName}] measured.devices must list at least one environment`);
  } else {
    for (const d of measured.devices) {
      if (d.result !== "pass") {
        errors.push(
          `[${itemName}] Contradiction: environment "${d.env}" recorded result "${d.result}" (${d.notes ?? "no notes"}); evidence with a failing environment cannot be merged`
        );
      }
    }
  }

  // 3. Layout Shift (CLS <= 0.01 per TESTING.md §3)
  if (typeof measured.cls === "number" && measured.cls > 0.01) {
    errors.push(`[${itemName}] Contradiction: CLS ${measured.cls} exceeds maximum allowable threshold of 0.01`);
  }

  return errors;
}

/**
 * Collects all workspace paths that an item depends on:
 * - registry/items/<itemName>
 * - packages/runtime (when present in the repo)
 * - any registry item dependencies declared in meta.declared.json or imported via @/components/ui/<dep> or ../<dep>/
 */
export function getItemTrackedPaths(itemName: string, projectRoot = process.cwd()): string[] {
  const paths = new Set<string>([`registry/items/${itemName}`]);
  if (fs.existsSync(path.join(projectRoot, "packages", "runtime"))) {
    paths.add("packages/runtime");
  }
  const itemDir = path.join(projectRoot, "registry", "items", itemName);
  const declaredFile = path.join(itemDir, "meta.declared.json");
  if (fs.existsSync(declaredFile)) {
    try {
      const declared = JSON.parse(fs.readFileSync(declaredFile, "utf8"));
      for (const dep of declared?.dependencies?.registry ?? []) {
        if (typeof dep === "string" && dep.startsWith("@frictionborn/")) {
          const depName = dep.slice("@frictionborn/".length);
          if (fs.existsSync(path.join(projectRoot, "registry", "items", depName))) {
            paths.add(`registry/items/${depName}`);
          }
        }
      }
    } catch {
      // ignore invalid json here
    }
  }
  if (fs.existsSync(itemDir)) {
    for (const entry of fs.readdirSync(itemDir)) {
      if (!/\.(tsx|ts)$/.test(entry) || entry === "demo.tsx" || /\.test\.tsx?$/.test(entry)) continue;
      try {
        const src = fs.readFileSync(path.join(itemDir, entry), "utf8");
        const uiMatches = src.matchAll(/from\s+["']@\/components\/ui\/([a-z0-9-]+)["']/g);
        for (const m of uiMatches) {
          if (fs.existsSync(path.join(projectRoot, "registry", "items", m[1]))) {
            paths.add(`registry/items/${m[1]}`);
          }
        }
        const relMatches = src.matchAll(/from\s+["']\.\.\/([a-z0-9-]+)\//g);
        for (const m of relMatches) {
          if (fs.existsSync(path.join(projectRoot, "registry", "items", m[1]))) {
            paths.add(`registry/items/${m[1]}`);
          }
        }
      } catch {
        // ignore read error
      }
    }
  }
  return Array.from(paths);
}

/**
 * AGENTS lesson 13 & Audit A6: `measured` must describe the committed code, including shared runtime (`packages/runtime/**`)
 * and any workspace/registry dependencies imported by the item. Returns null when `benchCommit` is not reachable (shallow clone).
 */
export function codeChangedSinceBench(itemName: string, benchCommit: string, projectRoot = process.cwd()): string[] | null {
  try {
    const trackedPaths = getItemTrackedPaths(itemName, projectRoot);
    const out = execFileSync("git", ["diff", "--name-only", `${benchCommit}^{commit}`, "--", ...trackedPaths], {
      cwd: projectRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return out
      .split(/\r?\n/)
      .map((l) => l.trim().replace(/\\/g, "/"))
      .filter(
        (f) =>
          /\.(tsx|ts|css)$/.test(f) &&
          !/(^|\/)demo\.tsx$/.test(f) &&
          !/\.(test|spec|fixture)\.[jt]sx?$/.test(f)
      );
  } catch {
    return null;
  }
}

export interface SnapshotMeasuredInput {
  commit?: string;
  treeClean?: boolean;
  resultsHash?: string;
  date?: string;
  sizeKB?: { initial?: number; deferred?: number; method?: string };
  cls?: number;
  framesWhenIdle?: { offscreen?: number; hiddenTab?: number; reducedMotion?: number };
  axe?: { serious?: number; critical?: number };
  devices?: unknown[];
}

export function verifySnapshotIntegrity(
  itemName: string,
  itemDir: string,
  itemBenchDir: string,
  snapshotMeasured: SnapshotMeasuredInput | null | undefined
): string[] {
  const errors: string[] = [];

  // 2a. Dirty tree check: snapshot must record treeClean: true
  if (snapshotMeasured?.treeClean !== true) {
    errors.push(
      `[${itemName}] Release snapshot is missing 'treeClean: true' (bench:release must run on a clean working tree).`
    );
  }

  // 2c-1. Re-measure sizeKB deterministically when item component source exists
  const mainTsx = path.join(itemDir, `${itemName}.tsx`);
  if (fs.existsSync(mainTsx)) {
    const liveSize = measureItemSize(itemDir);
    const recSize = snapshotMeasured?.sizeKB;
    let sizeMatches =
      Boolean(recSize) &&
      recSize.initial === liveSize.initialGzipKB &&
      recSize.deferred === liveSize.deferredGzipKB &&
      recSize.method === liveSize.method;
    if (!sizeMatches && recSize && recSize.method === liveSize.method) {
      // Allow CRLF <-> LF line-ending normalization across git checkouts/worktrees while still hashing exact source content
      for (const eol of ["\n", "\r\n"] as const) {
        const files = fs.readdirSync(itemDir);
        const normBufs = (pred: (f: string) => boolean) => {
          const matched = files.filter(pred).sort();
          if (matched.length === 0) return 0;
          const combined = matched
            .map((f) => fs.readFileSync(path.join(itemDir, f), "utf8").replace(/\r?\n/g, eol))
            .join("");
          return Number((zlib.gzipSync(Buffer.from(combined, "utf8"), { level: 9 }).byteLength / 1024).toFixed(2));
        };
        const initKB = normBufs(
          (f) =>
            (f.endsWith(".ts") || f.endsWith(".tsx")) &&
            !f.endsWith(".gl.ts") &&
            !f.endsWith(".gl.tsx") &&
            !f.endsWith(".glsl.ts") &&
            f !== "demo.tsx" &&
            !f.endsWith(".test.ts") &&
            !f.endsWith(".test.tsx")
        );
        const defKB = normBufs((f) => f.endsWith(".gl.ts") || f.endsWith(".gl.tsx") || f.endsWith(".glsl.ts"));
        if (recSize.initial === initKB && recSize.deferred === defKB) {
          sizeMatches = true;
          break;
        }
      }
    }
    if (!sizeMatches) {
      errors.push(
        `[${itemName}] Release snapshot sizeKB (${recSize?.initial}/${recSize?.deferred} KB ${recSize?.method}) does not match live deterministic measurement (${liveSize.initialGzipKB}/${liveSize.deferredGzipKB} KB ${liveSize.method}).`
      );
    }
  }

  // 2c-2. Verify resultsHash and recompute numbers from raw-<commit>.json
  const commit = snapshotMeasured?.commit;
  const resultsHash = snapshotMeasured?.resultsHash;
  if (!resultsHash || typeof resultsHash !== "string" || !/^[0-9a-f]{64}$/.test(resultsHash)) {
    errors.push(`[${itemName}] Release snapshot is missing a valid 64-char SHA-256 'resultsHash'.`);
    return errors;
  }

  const rawFile = path.join(itemBenchDir, `raw-${commit}.json`);
  if (!fs.existsSync(rawFile)) {
    errors.push(`[${itemName}] Missing raw Playwright results file at bench/results/${itemName}/raw-${commit}.json.`);
    return errors;
  }

  const rawText = fs.readFileSync(rawFile, "utf8");
  const actualHash = hashRawResultsText(rawText);
  if (actualHash !== resultsHash) {
    errors.push(
      `[${itemName}] resultsHash mismatch: snapshot records ${resultsHash}, but bench/results/${itemName}/raw-${commit}.json hashes to ${actualHash}.`
    );
    return errors;
  }

  let rawParsed: RawResultsInput | null = null;
  try {
    rawParsed = JSON.parse(rawText) as RawResultsInput;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(`[${itemName}] Invalid JSON in raw-${commit}.json: ${msg}`);
    return errors;
  }

  const recomputed = recomputeFromRawResults(rawParsed, snapshotMeasured.date);
  if (!recomputed) {
    errors.push(`[${itemName}] Could not recompute metrics from bench/results/${itemName}/raw-${commit}.json.`);
    return errors;
  }

  if (snapshotMeasured.cls !== recomputed.cls) {
    errors.push(
      `[${itemName}] Edited number detected: cls (${snapshotMeasured.cls}) does not match raw-${commit}.json (${recomputed.cls}).`
    );
  }
  if (JSON.stringify(snapshotMeasured.framesWhenIdle) !== JSON.stringify(recomputed.framesWhenIdle)) {
    errors.push(
      `[${itemName}] Edited number detected: framesWhenIdle (${JSON.stringify(snapshotMeasured.framesWhenIdle)}) does not match raw-${commit}.json (${JSON.stringify(recomputed.framesWhenIdle)}).`
    );
  }
  if (JSON.stringify(snapshotMeasured.axe) !== JSON.stringify(recomputed.axe)) {
    errors.push(
      `[${itemName}] Edited number detected: axe (${JSON.stringify(snapshotMeasured.axe)}) does not match raw-${commit}.json (${JSON.stringify(recomputed.axe)}).`
    );
  }
  if (JSON.stringify(snapshotMeasured.devices) !== JSON.stringify(recomputed.devices)) {
    errors.push(
      `[${itemName}] Edited devices detected: devices in snapshot do not match recomputed Playwright outcomes from raw-${commit}.json.`
    );
  }

  return errors;
}

function readJson(file: string): any {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

/**
 * Merge bench evidence into each item's meta.json.
 *
 * - `check: true` is the CI mode: committed data only. Nothing is written; it fails if
 *   meta.json is not `meta.declared.json` + the verified `measured` block from the release snapshot
 *   and raw-<commit>.json.
 * - Fixtures (`"fixture": true`, e.g. dummy) are never rewritten.
 * - An item with no local bench result keeps the `measured` it already has.
 */
export function verifyItemEvidence(
  itemDir: string,
  benchDir: string,
  options: { check?: boolean } = {}
): { ok: boolean; errors: string[] } {
  const check = options.check === true;
  const itemName = path.basename(itemDir);
  const declaredFile = path.join(itemDir, "meta.declared.json");
  if (!fs.existsSync(declaredFile)) {
    return { ok: true, errors: [] };
  }

  const declared = readJson(declaredFile);
  if (declared.fixture === true) {
    return { ok: true, errors: [] };
  }

  const outputFile = path.join(itemDir, "meta.json");
  const existing = fs.existsSync(outputFile) ? readJson(outputFile) : null;
  const itemBenchDir = path.join(benchDir, itemName);
  const releaseFiles = fs.existsSync(itemBenchDir)
    ? fs.readdirSync(itemBenchDir).filter((f) => f.startsWith("release-") && f.endsWith(".json"))
    : [];

  const errors: string[] = [];
  const projectRoot = path.resolve(itemDir, "..", "..", "..");

  if (check) {
    const expected = existing?.measured !== undefined ? { ...declared, measured: existing.measured } : declared;
    if (!existing || JSON.stringify(existing) !== JSON.stringify(expected)) {
      errors.push(
        `[${itemName}] meta.json is out of sync with meta.declared.json. Run 'pnpm meta' locally and commit the result.`
      );
      return { ok: false, errors };
    }

    if (existing.measured !== undefined) {
      if (releaseFiles.length === 0) {
        errors.push(
          `[${itemName}] meta.json contains 'measured' data, but no committed release snapshot exists at bench/results/${itemName}/release-*.json (Hard Rule 6).`
        );
        return { ok: false, errors };
      }

      const versionMatch = `release-${declared.item.version}.json`;
      const chosenFile = releaseFiles.includes(versionMatch) ? versionMatch : releaseFiles.sort().reverse()[0];
      const snapshotRaw = readJson(path.join(itemBenchDir, chosenFile));
      const snapshotMeasured = snapshotRaw.measured || snapshotRaw;

      if (JSON.stringify(existing.measured) !== JSON.stringify(snapshotMeasured)) {
        errors.push(
          `[${itemName}] Hand-edited 'measured' data detected in meta.json. Values do not match committed release snapshot bench/results/${itemName}/${chosenFile} (Hard Rule 6).`
        );
        return { ok: false, errors };
      }

      const integrityErrors = verifySnapshotIntegrity(itemName, itemDir, itemBenchDir, snapshotMeasured);
      if (integrityErrors.length > 0) {
        errors.push(...integrityErrors);
        return { ok: false, errors };
      }

      const contradictions = validateMeasuredAgainstDeclared(declared, existing.measured, itemName);
      if (contradictions.length > 0) {
        errors.push(...contradictions);
        return { ok: false, errors };
      }
      const stale = codeChangedSinceBench(
        itemName,
        existing.measured.commit,
        fs.existsSync(path.join(projectRoot, ".git")) ? projectRoot : process.cwd()
      );
      if (stale && stale.length > 0) {
        errors.push(
          `[${itemName}] Stale evidence: ${stale.join(", ")} changed after the bench commit ${existing.measured.commit}. Re-run 'pnpm bench:release --item ${itemName}' on committed code, then 'pnpm meta' (AGENTS lesson 13).`
        );
        return { ok: false, errors };
      }
    } else {
      if (releaseFiles.length > 0) {
        errors.push(
          `[${itemName}] Release snapshot exists at bench/results/${itemName}/${releaseFiles[0]}, but meta.json is missing 'measured' data. Run 'pnpm meta' to merge.`
        );
        return { ok: false, errors };
      }
    }
    return { ok: true, errors: [] };
  }

  // Non-check mode: merge evidence
  let measuredData: any = null;
  const latestBenchFile = path.join(itemBenchDir, "latest.json");
  if (releaseFiles.length > 0) {
    const versionMatch = `release-${declared.item.version}.json`;
    const chosenFile = releaseFiles.includes(versionMatch) ? versionMatch : releaseFiles.sort().reverse()[0];
    try {
      const benchResult = readJson(path.join(itemBenchDir, chosenFile));
      measuredData = benchResult.measured || benchResult;
    } catch (err: any) {
      errors.push(`Failed to parse release snapshot for ${itemName}: ${err.message}`);
      return { ok: false, errors };
    }
  } else if (fs.existsSync(latestBenchFile)) {
    try {
      const benchResult = readJson(latestBenchFile);
      measuredData = benchResult.measured || benchResult;
    } catch (err: any) {
      errors.push(`Failed to parse bench result for ${itemName}: ${err.message}`);
      return { ok: false, errors };
    }
  }

  if (measuredData) {
    if (releaseFiles.length > 0) {
      const integrityErrors = verifySnapshotIntegrity(itemName, itemDir, itemBenchDir, measuredData);
      if (integrityErrors.length > 0) {
        errors.push(...integrityErrors);
        return { ok: false, errors };
      }
    }
    const contradictions = validateMeasuredAgainstDeclared(declared, measuredData, itemName);
    if (contradictions.length > 0) {
      errors.push(...contradictions);
      return { ok: false, errors };
    }
    fs.writeFileSync(outputFile, JSON.stringify({ ...declared, measured: measuredData }, null, 2) + "\n", "utf8");
  } else {
    const combined = existing?.measured !== undefined ? { ...declared, measured: existing.measured } : declared;
    fs.writeFileSync(outputFile, JSON.stringify(combined, null, 2) + "\n", "utf8");
  }

  return { ok: true, errors: [] };
}

export function mergeAllEvidence(options: { check?: boolean } = {}): boolean {
  const projectRoot = process.cwd();
  const itemsDir = path.join(projectRoot, "registry", "items");
  const benchDir = path.join(projectRoot, "bench", "results");
  let hasErrors = false;

  if (!fs.existsSync(itemsDir)) {
    console.log("No registry items found to merge evidence for.");
    return true;
  }

  const items = fs.readdirSync(itemsDir, { withFileTypes: true });
  for (const item of items) {
    if (!item.isDirectory()) continue;
    const itemDir = path.join(itemsDir, item.name);
    const res = verifyItemEvidence(itemDir, benchDir, options);
    if (!res.ok) {
      hasErrors = true;
      for (const err of res.errors) {
        console.error(`❌ ${err}`);
      }
    } else {
      console.log(`✔ ${item.name}: evidence verified / merged successfully.`);
    }
  }

  return !hasErrors;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const ok = mergeAllEvidence({ check: process.argv.includes("--check") });
  process.exit(ok ? 0 : 1);
}
