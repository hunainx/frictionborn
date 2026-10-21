// Original — Frictionborn Motion benchmark orchestrator
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { measureItemSize } from "./size/measure.ts";
import { hashRawResultsText, PROJECT_LABELS, recomputeFromRawResults } from "../scripts/merge-evidence.ts";

/** round 4 (DECISIONS 54): the 2D-canvas items, which also run bench/specs/canvas-items.spec.ts */
const CANVAS_ITEMS = [
  "flame-switch",
  "ember-badge",
  "light-leak-tabs",
  "temper-slider",
  "match-progress",
  "fuse-toast",
  "flint-button",
  "hold-to-confirm",
  "eclipse-switch",
  "firework-rating",
  "ash-text",
  "lantern-sky",
];

/** Multi-component integration and WebGL budget stress specs and the items they target */
export const COMBINED_PAGE_ITEMS = ["smooth-scroll", "sticky-scroll-story", "noise-field", "marquee"];
export const STRESS_GL_ITEMS = ["noise-field", "particle-field", "mesh-gradient"];

export function getBenchSpecsForItem(itemName: string): string[] {
  const specs = [
    "bench/specs/a11y.spec.ts",
    "bench/specs/behaviour.spec.ts",
    "bench/specs/context-loss.spec.ts",
    "bench/specs/dpr-cap.spec.ts",
    "bench/specs/leak.spec.ts",
    "bench/specs/mobile.spec.ts",
    "bench/specs/reduced-motion.spec.ts",
    "bench/specs/ssr.spec.ts",
    "bench/specs/stress.spec.ts",
    "bench/specs/webgl-support.spec.ts",
  ];
  if (itemName !== "dummy") {
    specs.push("bench/specs/paused.spec.ts");
  }
  if (itemName === "distortion-image") {
    specs.push("bench/specs/distortion-image.spec.ts");
  } else if (itemName === "smooth-scroll") {
    specs.push("bench/specs/smooth-scroll.spec.ts");
  } else if (itemName === "marquee") {
    specs.push("bench/specs/marquee.spec.ts");
  } else if (itemName === "text-reveal") {
    specs.push("bench/specs/text-reveal-flash.spec.ts");
  } else if (itemName === "ambient-hero") {
    specs.push("bench/specs/ambient-hero.spec.ts");
  } else if (itemName === "scroll-showcase") {
    specs.push("bench/specs/scroll-showcase.spec.ts");
  } else if (itemName === "ember-core") {
    specs.push("bench/specs/ember-core.spec.ts");
  } else if (itemName === "mesh-gradient") {
    specs.push("bench/specs/mesh-speed.spec.ts");
  }
  // round 4: the canvas items ported from the lab (keyboard path, pixels read back, quiet when idle)
  if (CANVAS_ITEMS.includes(itemName)) specs.push("bench/specs/canvas-items.spec.ts");
  // Multi-component integration & WebGL budget stress specs for every item they target
  if (COMBINED_PAGE_ITEMS.includes(itemName)) specs.push("bench/specs/combined-page.spec.ts");
  if (STRESS_GL_ITEMS.includes(itemName)) specs.push("bench/specs/stress-gl.spec.ts");
  return specs;
}

function getGitCommit(projectRoot = process.cwd()): string {
  try {
    return execSync("git rev-parse --short HEAD", { cwd: projectRoot, encoding: "utf8" }).trim();
  } catch {
    return "dev-local";
  }
}

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

export function isWorkingTreeClean(
  projectRoot = process.cwd(),
  options: { ignoreBenchResults?: boolean } = {}
): boolean {
  try {
    const out = execSync("git status --porcelain", { cwd: projectRoot, encoding: "utf8" });
    const lines = out
      .split(/\r?\n/)
      .filter((l) => l.trim().length > 0);
    if (!options.ignoreBenchResults) {
      return lines.length === 0;
    }
    const nonBench = lines.filter((line) => {
      const filePart = line.slice(3).trim().replace(/^"|"$/g, "").replace(/\\/g, "/");
      return !filePart.startsWith("bench/results/");
    });
    return nonBench.length === 0;
  } catch {
    return false;
  }
}

export function runBench(
  itemName = "dummy",
  options: { isRelease?: boolean; project?: string; projectRoot?: string; ignoreBenchResultsInCleanCheck?: boolean } = {}
): boolean {
  const isRelease = options.isRelease ?? process.argv.includes("--release");
  const project = options.project;
  const projectRoot = options.projectRoot ?? process.cwd();
  if (project && isRelease) {
    console.error("--project runs one browser only; a release snapshot needs all of them. Run --release without --project.");
    return false;
  }

  const treeClean = isWorkingTreeClean(projectRoot, {
    ignoreBenchResults: options.ignoreBenchResultsInCleanCheck,
  });
  if (isRelease && !treeClean) {
    console.error(
      `✖ Refusing to run bench:release for [${itemName}] on a dirty working tree (git status --porcelain is not empty). Commit or stash changes first.`
    );
    return false;
  }

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
    const base = process.platform === "win32" ? "npx.cmd playwright test" : "npx playwright test";
    const specs = getBenchSpecsForItem(itemName);
    const specFiles = specs.join(" ");
    const cmd = project ? `${base} --project=${project} ${specFiles}` : `${base} ${specFiles}`;
    execSync(cmd, {
      stdio: "inherit",
      cwd: projectRoot,
      env: { ...process.env, CI: "1", BENCH_ITEM: itemName },
    });
  } catch {
    console.error("Playwright run exited with test failures or errors");
    playwrightSucceeded = false;
  }

  // Per-project results come from the Playwright report only (never hard-coded).
  const projectResults = new Map<string, { passed: number; failed: number; flaky: number }>();
  const rawSpecs: Array<{ file: string; title: string; projectName: string; status: string }> = [];
  if (fs.existsSync(reportPath)) {
    try {
      const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
      const visit = (suite: any, parentFile = "") => {
        const suiteFile = suite.file || parentFile;
        for (const spec of suite.specs || []) {
          for (const test of spec.tests || []) {
            const entry = projectResults.get(test.projectName) ?? { passed: 0, failed: 0, flaky: 0 };
            if (test.status === "expected") entry.passed++;
            else if (test.status === "flaky") entry.flaky++; // failed, then passed on the CI retry: recorded, not hidden
            else if (test.status !== "skipped") entry.failed++;
            projectResults.set(test.projectName, entry);
            rawSpecs.push({
              file: String(spec.file || suiteFile || "").replace(/\\/g, "/"),
              title: String(spec.title || ""),
              projectName: String(test.projectName || ""),
              status: String(test.status || ""),
            });
          }
        }
        for (const child of suite.suites || []) visit(child, suiteFile);
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

  // Collect raw probe files from spec runs
  const rawProbes: Array<{ file: string; data: unknown }> = [];
  if (fs.existsSync(rawDir)) {
    const rawFiles = fs
      .readdirSync(rawDir)
      .filter((f) => f.endsWith(".json"))
      .sort();
    for (const rf of rawFiles) {
      try {
        const rawContent = JSON.parse(fs.readFileSync(path.join(rawDir, rf), "utf8"));
        rawProbes.push({ file: rf, data: rawContent });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`Could not read measurement file ${rf}: ${msg}`);
      }
    }
    // Clean up temporary raw measurement dir
    fs.rmSync(rawDir, { recursive: true, force: true });
  }

  const commit = getGitCommit(projectRoot);
  const date = getToday();

  const rawPayload = {
    item: itemName,
    commit,
    date,
    playwright: {
      projects: Object.fromEntries(projectResults.entries()),
      specs: rawSpecs,
    },
    probes: rawProbes,
  };

  const recomputed = recomputeFromRawResults(rawPayload, date);
  if (!recomputed) {
    console.error(`✖ Incomplete measurements for [${itemName}]. Missing real metrics from specs.`);
    return false;
  }

  // Write raw-<commit>.json and compute its SHA-256 resultsHash
  if (isRelease) {
    for (const existingFile of fs.readdirSync(resultsDir)) {
      if (/^raw-.*\.json$/.test(existingFile) && existingFile !== `raw-${commit}.json`) {
        fs.unlinkSync(path.join(resultsDir, existingFile));
      }
    }
  }
  const rawCommitFile = path.join(resultsDir, `raw-${commit}.json`);
  const rawJsonText = JSON.stringify(rawPayload, null, 2) + "\n";
  fs.writeFileSync(rawCommitFile, rawJsonText, "utf8");
  const resultsHash = hashRawResultsText(rawJsonText);

  const declaredPath = path.join(itemDir, "meta.declared.json");
  const declared = fs.existsSync(declaredPath) ? JSON.parse(fs.readFileSync(declaredPath, "utf8")) : null;
  const version = declared?.item?.version || "0.1.0";

  const benchJson = {
    commit,
    ...(treeClean ? { treeClean: true as const } : {}),
    resultsHash,
    date,
    sizeKB: {
      initial: size.initialGzipKB,
      deferred: size.deferredGzipKB,
      method: size.method,
    },
    cls: recomputed.cls,
    framesWhenIdle: recomputed.framesWhenIdle,
    axe: recomputed.axe,
    devices: recomputed.devices,
  };

  const rawOutDir = path.join(resultsDir, "raw");
  fs.mkdirSync(rawOutDir, { recursive: true });

  const benchOut = path.join(resultsDir, "bench.json");
  const latestOut = path.join(resultsDir, "latest.json");
  const commitOut = path.join(resultsDir, `${commit}.json`);
  const rawBenchOut = path.join(rawOutDir, "bench.json");
  const rawLatestOut = path.join(rawOutDir, "latest.json");
  const rawCommitOut = path.join(rawOutDir, `${commit}.json`);

  fs.writeFileSync(benchOut, JSON.stringify(benchJson, null, 2) + "\n", "utf8");
  fs.writeFileSync(latestOut, JSON.stringify(benchJson, null, 2) + "\n", "utf8");
  fs.writeFileSync(commitOut, JSON.stringify(benchJson, null, 2) + "\n", "utf8");
  fs.writeFileSync(rawBenchOut, JSON.stringify(benchJson, null, 2) + "\n", "utf8");
  fs.writeFileSync(rawLatestOut, JSON.stringify(benchJson, null, 2) + "\n", "utf8");
  fs.writeFileSync(rawCommitOut, JSON.stringify(benchJson, null, 2) + "\n", "utf8");

  console.log(`\n✔ Wrote raw Playwright results: ${path.relative(projectRoot, rawCommitFile)} (SHA-256: ${resultsHash.slice(0, 12)}…)`);
  console.log(`✔ Wrote bench output: ${path.relative(projectRoot, benchOut)}`);
  console.log(`✔ Wrote latest output: ${path.relative(projectRoot, latestOut)}`);
  console.log(`✔ Wrote commit output: ${path.relative(projectRoot, commitOut)}`);

  if (isRelease) {
    const releaseOut = path.join(resultsDir, `release-${version}.json`);
    fs.writeFileSync(releaseOut, JSON.stringify(benchJson, null, 2) + "\n", "utf8");
    console.log(`✔ Wrote release snapshot: ${path.relative(projectRoot, releaseOut)}\n`);
  } else {
    console.log(`ℹ Normal run: release snapshot not rewritten (pass --release to update tracked release snapshots)\n`);
  }

  return playwrightSucceeded;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const isRelease = args.includes("--release");
  const projectIdx = args.indexOf("--project");
  const project = projectIdx !== -1 ? args[projectIdx + 1] : undefined;
  const shardIdx = args.indexOf("--shard");
  const shard = shardIdx !== -1 ? /^(\d+)\/(\d+)$/.exec(args[shardIdx + 1] ?? "") : null;
  if (shardIdx !== -1 && !shard) {
    console.error("--shard expects i/n, for example --shard 1/2");
    process.exit(1);
  }
  if (isRelease && !isWorkingTreeClean(process.cwd())) {
    console.error(
      "✖ Refusing to run bench:release on a dirty working tree (git status --porcelain is not empty). Commit or stash changes first."
    );
    process.exit(1);
  }
  const itemIdx = args.indexOf("--item");
  let items: string[];
  if (itemIdx !== -1 && args[itemIdx + 1]) {
    items = [args[itemIdx + 1]];
  } else {
    const itemsDir = path.join(process.cwd(), "registry", "items");
    items = fs
      .readdirSync(itemsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort();
    if (shard) {
      const [index, total] = [Number(shard[1]), Number(shard[2])];
      items = items.filter((_, i) => i % total === index - 1);
      console.log(`Shard ${index}/${total}: ${items.join(", ")}`);
    }
  }
  let ok = true;
  for (const item of items) {
    ok =
      runBench(item, {
        isRelease,
        project,
        ignoreBenchResultsInCleanCheck: items.length > 1,
      }) && ok;
  }

  process.exit(ok ? 0 : 1);
}
