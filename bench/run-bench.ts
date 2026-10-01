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

  const rawDir = path.join(resultsDir, "raw");
  if (fs.existsSync(rawDir)) {
    fs.rmSync(rawDir, { recursive: true, force: true });
  }

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

  // Aggregate real measurements from spec runs (Finding 2)
  let measuredCls = 0;
  let offscreenFrames: number | null = null;
  let hiddenTabFrames: number | null = null;
  let reducedMotionFrames: number | null = null;
  let axeSerious: number | null = null;
  let axeCritical: number | null = null;

  if (fs.existsSync(rawDir)) {
    const rawFiles = fs.readdirSync(rawDir).filter((f) => f.endsWith(".json"));
    for (const rf of rawFiles) {
      try {
        const rawContent = JSON.parse(fs.readFileSync(path.join(rawDir, rf), "utf8"));
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
      } catch (err: any) {
        console.warn(`Could not read measurement file ${rf}: ${err.message}`);
      }
    }
    // Clean up raw measurement dir
    fs.rmSync(rawDir, { recursive: true, force: true });
  }

  // Fail closed if any required measurement was not collected from the test suite
  if (
    offscreenFrames === null ||
    hiddenTabFrames === null ||
    reducedMotionFrames === null ||
    axeSerious === null ||
    axeCritical === null
  ) {
    console.error(`✖ Incomplete measurements for [${itemName}]. Missing real metrics from specs.`);
    return false;
  }

  const commit = getGitCommit();
  const date = getToday();

  const declaredPath = path.join(itemDir, "meta.declared.json");
  const declared = fs.existsSync(declaredPath) ? JSON.parse(fs.readFileSync(declaredPath, "utf8")) : null;
  const version = declared?.item?.version || "0.1.0";

  const devices = Array.from(projectResults.entries()).map(([project, r]) => ({
    env: PROJECT_LABELS[project] ?? project,
    via: "playwright" as const,
    tier: project.includes("mobile") ? 2 : 3,
    result: (r.failed === 0 ? "pass" : "fail") as "pass" | "fail",
    date,
    notes: `${r.passed} passed, ${r.failed} failed; all specs verified`,
  }));

  const benchJson = {
    commit,
    date,
    sizeKB: {
      initial: size.initialGzipKB,
      deferred: size.deferredGzipKB,
      method: size.method,
    },
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

  const benchOut = path.join(resultsDir, "bench.json");
  const latestOut = path.join(resultsDir, "latest.json");
  const commitOut = path.join(resultsDir, `${commit}.json`);
  const releaseOut = path.join(resultsDir, `release-${version}.json`);

  fs.writeFileSync(benchOut, JSON.stringify(benchJson, null, 2) + "\n", "utf8");
  fs.writeFileSync(latestOut, JSON.stringify(benchJson, null, 2) + "\n", "utf8");
  fs.writeFileSync(commitOut, JSON.stringify(benchJson, null, 2) + "\n", "utf8");
  fs.writeFileSync(releaseOut, JSON.stringify(benchJson, null, 2) + "\n", "utf8");

  console.log(`\n✔ Wrote bench output: ${path.relative(projectRoot, benchOut)}`);
  console.log(`✔ Wrote latest output: ${path.relative(projectRoot, latestOut)}`);
  console.log(`✔ Wrote commit output: ${path.relative(projectRoot, commitOut)}`);
  console.log(`✔ Wrote release snapshot: ${path.relative(projectRoot, releaseOut)}\n`);

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
