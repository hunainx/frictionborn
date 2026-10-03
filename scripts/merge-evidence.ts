// Original — Frictionborn Motion evidence merger
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export interface MergeResult {
  item: string;
  merged: boolean;
  errors: string[];
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

  // 3. Layout Shift (CLS <= 0.01 per TESTING.md §3)
  if (typeof measured.cls === "number" && measured.cls > 0.01) {
    errors.push(
      `[${itemName}] Contradiction: CLS ${measured.cls} exceeds maximum allowable threshold of 0.01`
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
 * - `check: true` is the CI mode: committed data only. Nothing is read from
 *   bench/results and nothing is written; it fails if meta.json is not exactly
 *   `meta.declared.json` + the `measured` block already committed in meta.json.
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

      const contradictions = validateMeasuredAgainstDeclared(declared, existing.measured, itemName);
      if (contradictions.length > 0) {
        errors.push(...contradictions);
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

/**
 * Merge bench evidence into each item's meta.json.
 *
 * - `check: true` is the CI mode: committed data only. Nothing is read from
 *   bench/results and nothing is written; it fails if meta.json is not exactly
 *   `meta.declared.json` + the `measured` block verified against committed release snapshot.
 * - Fixtures (`"fixture": true`, e.g. dummy) are never rewritten.
 * - An item with no local bench result keeps the `measured` it already has.
 */
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
