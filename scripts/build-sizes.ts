// Original — Frictionborn Motion generate performance sizes from size-limit output
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = process.cwd();
const OUTPUT_FILE = path.join(ROOT, "public", "r", "performance-sizes.json");

export interface SizeLimitEntry {
  name: string;
  passed: boolean;
  size: number;
  sizeLimit: number;
}

export interface PerformanceSizeRow {
  name: string;
  budgetLimit: string;
  measuredSize: string;
  passed: boolean;
  size: number;
  sizeLimit: number;
}

export function generatePerformanceSizes(): PerformanceSizeRow[] {
  const binPath = path.join(ROOT, "node_modules", "size-limit", "bin.js");
  const rawOutput = execFileSync(process.execPath, [binPath, "--json"], {
    cwd: ROOT,
    encoding: "utf8",
  });

  const parsed = JSON.parse(rawOutput) as SizeLimitEntry[];

  const rows: PerformanceSizeRow[] = parsed.map((entry) => ({
    name: entry.name,
    budgetLimit: `≤ ${(entry.sizeLimit / 1000).toFixed(1)} KB gzip`,
    measuredSize: `${(entry.size / 1000).toFixed(2)} KB gzip`,
    passed: entry.passed,
    size: entry.size,
    sizeLimit: entry.sizeLimit,
  }));

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(rows, null, 2) + "\n", "utf8");
  return rows;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  try {
    const rows = generatePerformanceSizes();
    console.log("✔ Generated public/r/performance-sizes.json from size-limit output:");
    for (const r of rows) {
      console.log(`  ${r.name}: ${r.measuredSize} (${r.budgetLimit}) -> ${r.passed ? "PASS" : "FAIL"}`);
    }
    const allPassed = rows.every((r) => r.passed);
    if (!allPassed) {
      process.exit(1);
    }
  } catch (err) {
    console.error("Failed to generate performance sizes:", err);
    process.exit(1);
  }
}
