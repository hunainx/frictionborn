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

export function mergeAllEvidence(): boolean {
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
    if (item.isDirectory()) {
      const declaredFile = path.join(itemsDir, item.name, "meta.declared.json");
      if (!fs.existsSync(declaredFile)) continue;

      const declared = JSON.parse(fs.readFileSync(declaredFile, "utf8"));
      const itemBenchDir = path.join(benchDir, item.name);
      const latestBenchFile = path.join(itemBenchDir, "latest.json");

      let measuredData: any = null;
      if (fs.existsSync(latestBenchFile)) {
        try {
          const benchResult = JSON.parse(fs.readFileSync(latestBenchFile, "utf8"));
          // bench result can be the measured object directly or contain a 'measured' field
          measuredData = benchResult.measured || benchResult;
        } catch (err: any) {
          console.error(`❌ Failed to parse bench result for ${item.name}: ${err.message}`);
          hasErrors = true;
          continue;
        }
      }

      if (measuredData) {
        const contradictions = validateMeasuredAgainstDeclared(declared, measuredData, item.name);
        if (contradictions.length > 0) {
          hasErrors = true;
          console.error(`❌ Contradiction check failed for ${item.name}:`);
          for (const err of contradictions) {
            console.error(`   - ${err}`);
          }
        } else {
          // Merge
          const combined = {
            ...declared,
            measured: measuredData,
          };
          const outputFile = path.join(itemsDir, item.name, "meta.json");
          fs.writeFileSync(outputFile, JSON.stringify(combined, null, 2) + "\n", "utf8");
          console.log(`✔ Merged evidence for ${item.name} -> meta.json`);
        }
      } else {
        // No bench results yet; create meta.json without measured or leave as-is
        const outputFile = path.join(itemsDir, item.name, "meta.json");
        fs.writeFileSync(outputFile, JSON.stringify(declared, null, 2) + "\n", "utf8");
        console.log(`ℹ No bench results found for ${item.name} (bench/results/${item.name}/latest.json) - generated meta.json from declared`);
      }
    }
  }

  return !hasErrors;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const ok = mergeAllEvidence();
  process.exit(ok ? 0 : 1);
}
