// Original — Frictionborn Motion `pnpm lighthouse`: Lighthouse CI on the PRODUCTION harness build, 3 runs, median,
// live composition vs poster-only, and proof that the GL actually rendered during the live runs.
//
//   pnpm lighthouse                 both compositions, 3 runs each
//   pnpm lighthouse --runs 5        more runs
//   pnpm lighthouse --item ambient-hero
//   pnpm lighthouse --no-build      reuse bench/harness/.next
//   pnpm lighthouse --chrome-flags "--headless --no-sandbox"   use the machine's real GPU instead of software GL
//
// "live"   = the page as a mid-range phone gets it (mobile preset: touch, slow CPU, 4G; 8 cores / 8 GB emulated so the
//            tier gate picks tier 2). The gatherer must see the WebGL context draw real pixels, or the run fails.
// "poster" = the same URL with prefers-reduced-motion emulated: every item renders its reduced-motion poster.
//
// Exit code 1 if: live is more than 5 points below poster-only, a live run did not render WebGL (the comparison would be
// meaningless), or the poster-only control issued draw calls. Results: bench/results/lighthouse.json (git-ignored; CI uploads it).
import fs from "node:fs";
import path from "node:path";
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const root = process.cwd();
const argv = process.argv.slice(2);
const arg = (name: string, fallback: string): string => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};
const RUNS = Number(arg("runs", "3"));
const PORT = Number(arg("port", process.env.LH_PORT ?? "3110"));
const ONLY = argv.includes("--item") ? arg("item", "") : "";
const BASE = `http://localhost:${PORT}`;
const MAX_DELTA = 5;
// Software GL (SwiftShader) is the default so a CI runner without a GPU and a dev machine measure the same thing.
const CHROME_FLAGS = arg("chrome-flags", "--headless=new --no-sandbox --use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist");

interface Composition {
  name: string;
  /** Does the composition contain WebGL at all? (ScrollShowcase does not: its control is "0 draw calls".) */
  usesGl: boolean;
}
const COMPOSITIONS: Composition[] = [
  { name: "ambient-hero", usesGl: true },
  { name: "scroll-showcase", usesGl: false },
].filter((c) => !ONLY || c.name === ONLY);

const urlFor = (name: string) => `${BASE}/items/${name}`;

const median = (xs: number[]): number => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

function run(cmd: string, args: string[]) {
  const r = spawnSync(cmd, args, { cwd: root, stdio: "inherit", encoding: "utf8" });
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(" ")} exited with ${r.status}`);
}

async function waitFor(url: string, ms: number) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`server did not answer at ${url}`);
}

interface Lhr {
  requestedUrl: string;
  configSettings: { formFactor: string; screenEmulation: { mobile: boolean } };
  categories: { performance: { score: number } };
  audits: Record<string, any>;
}

function readRuns(dir: string): Lhr[] {
  return fs
    .readdirSync(dir)
    .filter((f) => /^lhr-.*\.json$/.test(f))
    .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")) as Lhr);
}

function collect(configFile: string, urls: string[], additive: boolean) {
  run(process.execPath, [
    require.resolve("@lhci/cli/src/cli.js"),
    "collect",
    ...urls.map((u) => `--url=${u}`),
    `--numberOfRuns=${RUNS}`,
    ...(additive ? ["--additive"] : []), // a second collect would otherwise wipe the first one
    `--settings.configPath=bench/lighthouse/${configFile}`,
    `--settings.chromeFlags=${CHROME_FLAGS}`,
  ]);
}

async function main() {
  if (!argv.includes("--no-build")) {
    console.log("==> Production build of the bench harness (next build)");
    run(process.execPath, [require.resolve("next/dist/bin/next"), "build", "bench/harness"]);
  }

  console.log(`==> Starting production server (next start) on :${PORT}`);
  const server: ChildProcess = spawn(
    process.execPath,
    [require.resolve("next/dist/bin/next"), "start", "bench/harness", "-p", String(PORT)],
    { cwd: root, stdio: "ignore" },
  );
  const stop = () => {
    if (!server.killed) server.kill();
  };
  process.on("exit", stop);
  process.on("SIGINT", () => {
    stop();
    process.exit(130);
  });

  try {
    await waitFor(urlFor(COMPOSITIONS[0].name), 60000);

    const outDir = path.join(root, ".lighthouseci");
    fs.rmSync(outDir, { recursive: true, force: true });

    const urls = COMPOSITIONS.map((c) => urlFor(c.name));
    console.log(`==> lhci collect (live): ${urls.length} URLs x ${RUNS} runs, mobile preset, simulated slow 4G / 4x CPU`);
    collect("lighthouse-config.mjs", urls, false);
    console.log(`==> lhci collect (poster-only control, prefers-reduced-motion emulated): ${urls.length} URLs x ${RUNS} runs`);
    collect("lighthouse-config-poster.mjs", urls, true);

    const all = readRuns(outDir);
    const results: any[] = [];
    let failed = false;

    for (const comp of COMPOSITIONS) {
      const summarise = (mode: "live" | "poster") => {
        const runs = all.filter(
          (l) => l.requestedUrl === urlFor(comp.name) && (l.audits["fb-gl-ran"]?.details?.reducedMotion === true) === (mode === "poster"),
        );
        if (runs.length !== RUNS) throw new Error(`${comp.name} ${mode}: expected ${RUNS} reports, found ${runs.length}`);
        const gl = runs.map((l) => l.audits["fb-gl-ran"]);
        const d = (g: any) => g?.details ?? {};
        const scores = runs.map((l) => Math.round(l.categories.performance.score * 100));
        return {
          scores,
          score: median(scores),
          lcpMs: Math.round(median(runs.map((l) => l.audits["largest-contentful-paint"].numericValue))),
          fcpMs: Math.round(median(runs.map((l) => l.audits["first-contentful-paint"].numericValue))),
          tbtMs: Math.round(median(runs.map((l) => l.audits["total-blocking-time"].numericValue))),
          cls: Number(median(runs.map((l) => l.audits["cumulative-layout-shift"].numericValue)).toFixed(3)),
          mobileEmulation: runs.every((l) => l.configSettings.formFactor === "mobile" && l.configSettings.screenEmulation.mobile),
          glRanRuns: gl.filter((g) => g?.numericValue === 1).length,
          contextsDrawn: gl.map((g) => d(g).contextsDrawn ?? null),
          draws: gl.map((g) => d(g).drawsTotal ?? null),
          earlySample: gl.map((g) => (d(g).early && !d(g).early.error ? { std: Math.round(d(g).early.std * 10) / 10, coverage: d(g).early.coverage } : null)),
          endReadback: gl.map((g) => (d(g).readback && !d(g).readback.error ? { std: Math.round(d(g).readback.std * 10) / 10, coverage: d(g).readback.coverage } : null)),
          itemTiers: gl.map((g) => (d(g).items ?? []).map((i: any) => `${i.item}:${i.tier}`)),
          pointerCoarse: gl.map((g) => d(g).pointerCoarse ?? null),
          reducedMotion: gl.map((g) => d(g).reducedMotion ?? null),
          // Where the main thread time went in the first run (script URL -> ms of scripting), to explain a TBT gap.
          topScripts: (runs[0].audits["bootup-time"]?.details?.items ?? [])
            .slice(0, 5)
            .map((i: any) => ({ url: String(i.url).replace(/^.*\/_next\//, "_next/").slice(0, 80), scriptingMs: Math.round(i.scripting ?? 0), totalMs: Math.round(i.total ?? 0) })),
          longTasks: (runs[0].audits["long-tasks"]?.details?.items ?? []).slice(0, 5).map((i: any) => ({ url: String(i.url).replace(/^.*\/_next\//, "_next/").slice(0, 80), ms: Math.round(i.duration) })),
          hardwareConcurrency: d(gl[0]).hardwareConcurrency ?? null,
          viewport: d(gl[0]).viewport ?? null,
        };
      };
      const live = summarise("live");
      const poster = summarise("poster");
      const delta = live.score - poster.score;
      const problems: string[] = [];
      if (!live.mobileEmulation) problems.push("not a mobile-emulated run");
      if (comp.usesGl && live.glRanRuns !== RUNS) problems.push(`GL rendered in only ${live.glRanRuns}/${RUNS} live runs: the comparison is meaningless`);
      if (!comp.usesGl && live.draws.some((n: number | null) => (n ?? 0) > 0)) problems.push("a composition declared GL-free issued WebGL draw calls");
      // The capability probe creates (and immediately loses) one context: only draw calls count as "rendered".
      if (poster.glRanRuns !== 0 || poster.draws.some((n: number | null) => (n ?? 0) > 0)) problems.push("the poster-only control rendered WebGL");
      if (delta < -MAX_DELTA) problems.push(`live is ${-delta} points below poster-only (limit ${MAX_DELTA})`);
      if (problems.length) failed = true;
      results.push({ name: comp.name, usesGl: comp.usesGl, live, poster, delta, pass: problems.length === 0, problems });
    }

    const summary = { date: new Date().toISOString(), runs: RUNS, preset: "mobile", chromeFlags: CHROME_FLAGS, server: "next start (production build)", results };
    fs.mkdirSync(path.join(root, "bench", "results"), { recursive: true });
    fs.writeFileSync(path.join(root, "bench", "results", "lighthouse.json"), JSON.stringify(summary, null, 2));

    console.log(`\n==================== Lighthouse (mobile, production build, median of ${RUNS}) ====================`);
    console.log(`Chrome flags: ${CHROME_FLAGS}`);
    for (const r of results) {
      console.log(`${r.name}  live ${r.live.score} [${r.live.scores}]  poster ${r.poster.score} [${r.poster.scores}]  delta ${r.delta >= 0 ? "+" : ""}${r.delta}  ${r.pass ? "PASS" : "FAIL"}`);
      console.log(`   live   LCP ${r.live.lcpMs} ms  FCP ${r.live.fcpMs} ms  TBT ${r.live.tbtMs} ms  CLS ${r.live.cls}`);
      console.log(`          GL rendered in ${r.live.glRanRuns}/${RUNS} runs; contexts that drew ${r.live.contextsDrawn}; draw calls ${r.live.draws}; viewport ${r.live.viewport}; coarse pointer ${r.live.pointerCoarse}; cores ${r.live.hardwareConcurrency}`);
      console.log(`          tiers ${JSON.stringify(r.live.itemTiers[0])}`);
      console.log(`   poster LCP ${r.poster.lcpMs} ms  FCP ${r.poster.fcpMs} ms  TBT ${r.poster.tbtMs} ms  CLS ${r.poster.cls}`);
      console.log(`          GL rendered in ${r.poster.glRanRuns}/${RUNS} runs; draw calls ${r.poster.draws}; reduced motion ${r.poster.reducedMotion}`);
      for (const p of r.problems) console.log(`   !! ${p}`);
    }
    console.log("Saved bench/results/lighthouse.json");
    if (failed) process.exitCode = 1;
  } finally {
    stop();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
