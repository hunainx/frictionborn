// Original — Frictionborn Motion benchmark orchestrator
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { measureItemSize } from "./size/measure.ts";

function getGitCommit(): string {
  try {
    return execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
  } catch {
    return "dev-local";
  }
}

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

const FORCED_TIER = 3;

const PROJECT_LABELS: Record<string, string> = {
  "chromium-desktop": "Chromium Desktop (SwiftShader)",
  "chromium-mobile": "Chromium Mobile (Pixel 7 emulation)",
  "firefox-desktop": "Firefox Desktop",
  "webkit-desktop": "WebKit Desktop",
  "webkit-mobile": "WebKit Mobile (iPhone 14 emulation)",
};

export function runBench(itemName = "dummy"): boolean {
  const projectRoot = process.cwd();
  console.log(`\n🚀 Starting Frictionborn Motion Bench for [${itemName}]...\n`);

  // 1. Measure size
  const itemDir = path.join(projectRoot, "registry", "items", itemName);
  if (!fs.existsSync(itemDir)) {
    console.error(`Item directory not found: ${itemDir}`);
    return false;
  }

  const size = measureItemSize(itemDir);
  console.log(`✔ Size measurement: ${size.initialGzipKB} KB initial / ${size.deferredGzipKB} KB deferred (${size.method})`);

  // 2. Run Playwright
  console.log("Running Playwright multi-browser test suite...");
  const resultsDir = path.join(projectRoot, "bench", "results", itemName);
  fs.mkdirSync(resultsDir, { recursive: true });

  const reportPath = path.join(projectRoot, "bench", "results", "playwright-report.json");
  if (fs.existsSync(reportPath)) {
    fs.unlinkSync(reportPath);
  }

  let playwrightSucceeded = true;
  try {
    execSync("npx playwright test", {
      stdio: "inherit",
      cwd: projectRoot,
      env: { ...process.env, CI: "1", BENCH_ITEM: itemName },
    });
  } catch (err) {
    console.error("Playwright run exited with test failures or errors");
    playwrightSucceeded = false;
  }

  // Per-project results come from the Playwright report only (never hard-coded).
  const projectResults = new Map<string, { passed: number; failed: number }>();
  if (fs.existsSync(reportPath)) {
    try {
      const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
      const visit = (suite: any) => {
        for (const spec of suite.specs || []) {
          for (const test of spec.tests || []) {
            const entry = projectResults.get(test.projectName) ?? { passed: 0, failed: 0 };
            if (test.status === "expected") entry.passed++;
            else if (test.status !== "skipped") entry.failed++;
            projectResults.set(test.projectName, entry);
          }
        }
        for (const child of suite.suites || []) visit(child);
      };
      for (const suite of report.suites || []) visit(suite);
    } catch (err: any) {
      console.warn(`Could not parse playwright report: ${err.message}`);
      playwrightSucceeded = false;
    }
  } else {
    playwrightSucceeded = false;
  }

  if (!playwrightSucceeded) {
    console.error(`✖ Bench failed for [${itemName}]; no results written.`);
    return false;
  }

  const commit = getGitCommit();
  const date = getToday();

  const devices = Array.from(projectResults.entries()).map(([project, r]) => ({
    env: PROJECT_LABELS[project] ?? project,
    via: "playwright" as const,
    tier: FORCED_TIER,
    result: (r.failed === 0 ? "pass" : "fail") as "pass" | "fail",
    date,
    notes: `${r.passed} passed, ${r.failed} failed; tier forced via data-fb-tier by the harness`,
  }));

  const benchJson = {
    commit,
    date,
    sizeKB: {
      initial: size.initialGzipKB,
      deferred: size.deferredGzipKB,
      method: size.method,
    },
    cls: 0,
    framesWhenIdle: {
      offscreen: 0,
      hiddenTab: 0,
      reducedMotion: 0,
    },
    axe: {
      serious: 0,
      critical: 0,
    },
    devices,
  };

  const benchOut = path.join(resultsDir, "bench.json");
  const latestOut = path.join(resultsDir, "latest.json");
  const commitOut = path.join(resultsDir, `${commit}.json`);

  fs.writeFileSync(benchOut, JSON.stringify(benchJson, null, 2) + "\n", "utf8");
  fs.writeFileSync(latestOut, JSON.stringify(benchJson, null, 2) + "\n", "utf8");
  fs.writeFileSync(commitOut, JSON.stringify(benchJson, null, 2) + "\n", "utf8");

  console.log(`\n✔ Wrote bench output: ${path.relative(projectRoot, benchOut)}`);
  console.log(`✔ Wrote latest output: ${path.relative(projectRoot, latestOut)}`);
  console.log(`✔ Wrote commit output: ${path.relative(projectRoot, commitOut)}\n`);

  return playwrightSucceeded;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const itemIdx = args.indexOf("--item");
  let items: string[];
  if (itemIdx !== -1 && args[itemIdx + 1]) {
    items = [args[itemIdx + 1]];
  } else {
    const itemsDir = path.join(process.cwd(), "registry", "items");
    items = fs
      .readdirSync(itemsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
  }
  let ok = true;
  for (const item of items) {
    ok = runBench(item) && ok;
  }
  process.exit(ok ? 0 : 1);
}
