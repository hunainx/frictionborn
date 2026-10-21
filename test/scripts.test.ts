// Original — Frictionborn Motion script and schema tests
import { describe, it, expect } from "vitest";
import { validateDeclaredMetadata } from "../scripts/validate-meta.ts";
import { validateMeasuredAgainstDeclared, codeChangedSinceBench, hashRawResultsText } from "../scripts/merge-evidence.ts";
import { buildRegistry, isSafeRegistryTarget, validateItemDependencies } from "../scripts/build-registry.ts";
import { measureItemSize } from "../bench/size/measure.ts";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { generateItemSpecSheet, generateCatalog, generateLlmsTxt } from "../scripts/build-catalog.ts";

const VALID_DECLARED_SAMPLE = {
  schemaVersion: "0.1",
  item: {
    name: "test-item",
    version: "0.1.0",
    summary: "Test component summary for verification.",
    slot: "background",
    kind: "dom",
  },
  intent: {
    useWhen: ["Background animation"],
    avoidWhen: ["Over-stimulating UI"],
  },
  runtime: {
    serverOutput: "static-layout",
    clientOnly: false,
    lazyLoaded: "no",
    requires: {
      react: ">=19",
      frameworks: ["next-app-router"],
      tailwind: "^4",
    },
  },
  dependencies: {
    npm: [],
    registry: [],
  },
  behavior: {
    loop: "none",
    webglContexts: 0,
    tiers: {
      "0": "Static",
      "1": "Static",
      "2": "Animated",
      "3": "Animated",
    },
    reducedMotion: {
      mode: "static",
      description: "Static fallback",
    },
    input: {
      pointer: "none",
      touch: "none",
      keyboard: "none",
    },
  },
  a11y: {
    role: "decorative",
    hiddenFromAT: true,
    textStaysInDom: true,
    pauseControl: "not-needed",
    wcag: ["2.2.2"],
  },
  composition: {
    maxPerPage: 5,
    singleton: false,
    conflictsWith: [],
    pairsWith: [],
  },
  props: [
    {
      name: "className",
      type: "string",
      default: "",
      effect: "CSS class names",
    },
  ],
  agent: {
    install: "npx shadcn@latest add @frictionborn/test-item",
    usage: "<TestItem />",
    mistakes: ["Don't use rAF directly"],
    verify: ["Inspect DOM"],
  },
  license: {
    code: "MIT",
    derivedFrom: [],
    notices: [],
    assets: [],
  },
};

describe("scripts/validate-meta", () => {
  it("validates a conforming declared metadata object", () => {
    const res = validateDeclaredMetadata(VALID_DECLARED_SAMPLE, "test.json");
    expect(res.valid).toBe(true);
    expect(res.errors).toHaveLength(0);
  });

  it("strictly rejects hand-written 'measured' metadata (Hard Rule 6)", () => {
    const invalid = {
      ...VALID_DECLARED_SAMPLE,
      measured: {
        commit: "abc1234",
        date: "2026-10-01",
        sizeKB: { initial: 1.2, deferred: 0, method: "esbuild+gzip" },
        cls: 0,
        framesWhenIdle: { offscreen: 0, hiddenTab: 0, reducedMotion: 0 },
        axe: { serious: 0, critical: 0 },
      },
    };
    const res = validateDeclaredMetadata(invalid, "test.json");
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes("Hand-written 'measured' property is strictly forbidden"))).toBe(true);
  });

  it("rejects invalid schemaVersion", () => {
    const invalid = { ...VALID_DECLARED_SAMPLE, schemaVersion: "99.0" };
    const res = validateDeclaredMetadata(invalid, "test.json");
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes("schemaVersion"))).toBe(true);
  });

  it("rejects summary longer than 160 characters", () => {
    const invalid = {
      ...VALID_DECLARED_SAMPLE,
      item: {
        ...VALID_DECLARED_SAMPLE.item,
        summary: "a".repeat(161),
      },
    };
    const res = validateDeclaredMetadata(invalid, "test.json");
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes("item.summary"))).toBe(true);
  });

  it("rejects non-MIT license code", () => {
    const invalid = {
      ...VALID_DECLARED_SAMPLE,
      license: {
        ...VALID_DECLARED_SAMPLE.license,
        code: "GPL-3.0",
      },
    };
    const res = validateDeclaredMetadata(invalid, "test.json");
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes("license.code"))).toBe(true);
  });
});

describe("scripts/merge-evidence", () => {
  const VALID_MEASURED = {
    commit: "d072f91",
    date: "2026-10-01",
    sizeKB: { initial: 1.5, deferred: 0, method: "esbuild+gzip" },
    cls: 0.005,
    framesWhenIdle: { offscreen: 0, hiddenTab: 0, reducedMotion: 0 },
    axe: { serious: 0, critical: 0 },
    devices: [
      {
        env: "Desktop Chrome",
        via: "playwright",
        tier: 2,
        result: "pass",
        date: "2026-10-01",
      },
    ],
  };

  it("accepts conforming bench results without contradictions", () => {
    const errs = validateMeasuredAgainstDeclared(VALID_DECLARED_SAMPLE, VALID_MEASURED, "test-item");
    expect(errs).toHaveLength(0);
  });

  it("rejects axe serious or critical accessibility violations", () => {
    const badA11y = {
      ...VALID_MEASURED,
      axe: { serious: 1, critical: 0 },
    };
    const errs = validateMeasuredAgainstDeclared(VALID_DECLARED_SAMPLE, badA11y, "test-item");
    expect(errs.some((e) => e.includes("axe-core detected 1 serious"))).toBe(true);
  });

  it("rejects idle offscreen frames when loop is none", () => {
    const leakedFrames = {
      ...VALID_MEASURED,
      framesWhenIdle: { offscreen: 12, hiddenTab: 0, reducedMotion: 0 },
    };
    const errs = validateMeasuredAgainstDeclared(VALID_DECLARED_SAMPLE, leakedFrames, "test-item");
    expect(errs.some((e) => e.includes("loop is declared 'none', but bench measured 12 off-screen frames"))).toBe(true);
  });

  it("rejects reduced-motion frames when mode is static", () => {
    const leakedMotion = {
      ...VALID_MEASURED,
      framesWhenIdle: { offscreen: 0, hiddenTab: 0, reducedMotion: 5 },
    };
    const errs = validateMeasuredAgainstDeclared(VALID_DECLARED_SAMPLE, leakedMotion, "test-item");
    expect(errs.some((e) => e.includes("reducedMotion mode is 'static', but bench measured 5 frames"))).toBe(true);
  });

  it("rejects CLS exceeding 0.01 threshold", () => {
    const badCls = {
      ...VALID_MEASURED,
      cls: 0.045,
    };
    const errs = validateMeasuredAgainstDeclared(VALID_DECLARED_SAMPLE, badCls, "test-item");
    expect(errs.some((e) => e.includes("CLS 0.045 exceeds maximum allowable threshold of 0.01"))).toBe(true);
  });
});

describe("scripts/merge-evidence release snapshot binding (Finding 11)", () => {
  it("passes check mode when meta.json matches committed release snapshot exactly", async () => {
    const { verifyItemEvidence } = await import("../scripts/merge-evidence.ts");

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "fb-test-evidence-"));
    try {
      const itemDir = path.join(tmpDir, "registry", "test-item");
      const benchDir = path.join(tmpDir, "bench", "results");
      const itemBenchDir = path.join(benchDir, "test-item");
      fs.mkdirSync(itemDir, { recursive: true });
      fs.mkdirSync(itemBenchDir, { recursive: true });

      const rawTxt =
        JSON.stringify(
          {
            item: "test-item",
            commit: "a1b2c3d",
            date: "2026-10-01",
            playwright: {
              specs: [{ file: "bench/specs/a11y.spec.ts", title: "ok", projectName: "chromium-desktop", status: "expected" }],
            },
            probes: [
              {
                file: "p.json",
                data: {
                  cls: 0,
                  framesWhenIdle: { offscreen: 0, hiddenTab: 0, reducedMotion: 0 },
                  axe: { serious: 0, critical: 0 },
                },
              },
            ],
          },
          null,
          2
        ) + "\n";
      fs.writeFileSync(path.join(itemBenchDir, "raw-a1b2c3d.json"), rawTxt);

      const measured = {
        commit: "a1b2c3d",
        treeClean: true,
        resultsHash: hashRawResultsText(rawTxt),
        date: "2026-10-01",
        sizeKB: { initial: 1.5, deferred: 0, method: "gzip-9" },
        cls: 0,
        framesWhenIdle: { offscreen: 0, hiddenTab: 0, reducedMotion: 0 },
        axe: { serious: 0, critical: 0 },
        devices: [
          {
            env: "Chromium Desktop (SwiftShader)",
            via: "playwright",
            tier: 3,
            result: "pass",
            date: "2026-10-01",
            notes: "1 passed, 0 failed",
          },
        ],
      };

      fs.writeFileSync(path.join(itemDir, "meta.declared.json"), JSON.stringify(VALID_DECLARED_SAMPLE, null, 2));
      fs.writeFileSync(
        path.join(itemDir, "meta.json"),
        JSON.stringify({ ...VALID_DECLARED_SAMPLE, measured }, null, 2)
      );
      fs.writeFileSync(
        path.join(itemBenchDir, "release-0.1.0.json"),
        JSON.stringify(measured, null, 2)
      );

      const res = verifyItemEvidence(itemDir, benchDir, { check: true });
      expect(res.ok).toBe(true);
      expect(res.errors).toHaveLength(0);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("fails check mode when a single number in meta.json is modified (Finding 11 guard)", async () => {
    const { verifyItemEvidence } = await import("../scripts/merge-evidence.ts");

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "fb-test-evidence-"));
    try {
      const itemDir = path.join(tmpDir, "registry", "test-item");
      const benchDir = path.join(tmpDir, "bench", "results");
      const itemBenchDir = path.join(benchDir, "test-item");
      fs.mkdirSync(itemDir, { recursive: true });
      fs.mkdirSync(itemBenchDir, { recursive: true });

      const snapshotMeasured = {
        commit: "a1b2c3d",
        date: "2026-10-01",
        sizeKB: { initial: 1.5, deferred: 0, method: "gzip-9" },
        cls: 0,
        framesWhenIdle: { offscreen: 0, hiddenTab: 0, reducedMotion: 0 },
        axe: { serious: 0, critical: 0 },
        devices: [{ env: "Chromium", via: "playwright", tier: 3, result: "pass", date: "2026-10-01" }],
      };

      // Hand-edit a single number: change cls from 0 to 0.005
      const tamperedMeasured = {
        ...snapshotMeasured,
        cls: 0.005,
      };

      fs.writeFileSync(path.join(itemDir, "meta.declared.json"), JSON.stringify(VALID_DECLARED_SAMPLE, null, 2));
      fs.writeFileSync(
        path.join(itemDir, "meta.json"),
        JSON.stringify({ ...VALID_DECLARED_SAMPLE, measured: tamperedMeasured }, null, 2)
      );
      fs.writeFileSync(
        path.join(itemBenchDir, "release-0.1.0.json"),
        JSON.stringify(snapshotMeasured, null, 2)
      );

      const res = verifyItemEvidence(itemDir, benchDir, { check: true });
      expect(res.ok).toBe(false);
      expect(res.errors.some((e: string) => e.includes("Hand-edited 'measured' data detected"))).toBe(true);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("fails check mode when meta.json has measured data but no release snapshot exists", async () => {
    const { verifyItemEvidence } = await import("../scripts/merge-evidence.ts");

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "fb-test-evidence-"));
    try {
      const itemDir = path.join(tmpDir, "registry", "test-item");
      const benchDir = path.join(tmpDir, "bench", "results");
      fs.mkdirSync(itemDir, { recursive: true });
      fs.mkdirSync(path.join(benchDir, "test-item"), { recursive: true });

      const measured = {
        commit: "a1b2c3d",
        date: "2026-10-01",
        sizeKB: { initial: 1.5, deferred: 0, method: "gzip-9" },
        cls: 0,
        framesWhenIdle: { offscreen: 0, hiddenTab: 0, reducedMotion: 0 },
        axe: { serious: 0, critical: 0 },
        devices: [{ env: "Chromium", via: "playwright", tier: 3, result: "pass", date: "2026-10-01" }],
      };

      fs.writeFileSync(path.join(itemDir, "meta.declared.json"), JSON.stringify(VALID_DECLARED_SAMPLE, null, 2));
      fs.writeFileSync(
        path.join(itemDir, "meta.json"),
        JSON.stringify({ ...VALID_DECLARED_SAMPLE, measured }, null, 2)
      );

      const res = verifyItemEvidence(itemDir, benchDir, { check: true });
      expect(res.ok).toBe(false);
      expect(res.errors.some((e: string) => e.includes("no committed release snapshot exists"))).toBe(true);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

describe("scripts/build-catalog", () => {
  it("generates markdown spec sheet, catalog, and llms.txt", () => {
    const spec = generateItemSpecSheet(VALID_DECLARED_SAMPLE);
    expect(spec).toContain("# test-item — Specification Sheet");
    expect(spec).toContain("npx shadcn@latest add @frictionborn/test-item");
    expect(spec).toContain("## Runtime & Server Boundaries");

    const catalog = generateCatalog([VALID_DECLARED_SAMPLE]);
    expect(catalog).toContain("# Frictionborn Motion — Component Catalog");
    expect(catalog).toContain("test-item");

    const llms = generateLlmsTxt([VALID_DECLARED_SAMPLE]);
    expect(llms).toContain("# Frictionborn Motion");
    expect(llms).toContain("test-item");
  });
});

describe("audit M3: generators tell the truth", () => {
  it("escapes pipes in the props table, prints defaults one way, and states the real tier meaning", () => {
    const meta = {
      ...VALID_DECLARED_SAMPLE,
      behavior: { ...(VALID_DECLARED_SAMPLE as any).behavior, tiers: { "0": "a", "1": "b", "2": "c", "3": "d" } },
      props: [
        { name: "as", type: '"h1" | "h2"', default: '"h1"', effect: "Tag" },
        { name: "by", type: "string", default: "word", effect: "Split" },
        { name: "src", type: "string", default: "undefined", effect: "Required" },
      ],
    };
    const md = generateItemSpecSheet(meta as any);
    expect(md).toContain('| `as` | `"h1" \\| "h2"` | `"h1"` | Tag |');
    expect(md).toContain('| `by` | `string` | `"word"` | Split |');
    expect(md).toContain("| `src` | `string` | `—` | Required |");
    expect(md).toContain("T1 Lite (coarse pointer on a low-end device");
    expect(md).not.toContain("Mid-range mobile");
  });

  it("only tells an item to install the reveal gate when its source reads data-motion", () => {
    expect(generateItemSpecSheet(VALID_DECLARED_SAMPLE as any, { readsDataMotion: true, usesFrame: false })).toContain("initMotionReady()");
    const md = generateItemSpecSheet(VALID_DECLARED_SAMPLE as any, { readsDataMotion: false, usesFrame: false });
    expect(md).toContain("does not read `data-motion`");
    expect(md).not.toContain("stepped by the shared runtime");
  });

  it("llms.txt documents the registry namespace setup and initMotionReady", () => {
    const llms = generateLlmsTxt([VALID_DECLARED_SAMPLE]);
    expect(llms).toContain('"registries"');
    expect(llms).toContain("initMotionReady");
  });
});

describe("audit M3: evidence must be passing and current", () => {
  const base = {
    commit: "abc1234",
    date: "2026-10-05",
    sizeKB: { initial: 1, deferred: 0 },
    cls: 0,
    framesWhenIdle: { offscreen: 0, hiddenTab: 0, reducedMotion: 0 },
    axe: { serious: 0, critical: 0 },
  };
  it("rejects a recorded failing environment", () => {
    const errors = validateMeasuredAgainstDeclared(VALID_DECLARED_SAMPLE, { ...base, devices: [{ env: "Chromium", via: "playwright", tier: 3, result: "fail", date: "x", notes: "1 failed" }] }, "t");
    expect(errors.some((e: string) => e.includes("failing environment"))).toBe(true);
  });
  it("rejects evidence with no environments", () => {
    const errors = validateMeasuredAgainstDeclared(VALID_DECLARED_SAMPLE, { ...base, devices: [] }, "t");
    expect(errors.some((e: string) => e.includes("at least one environment"))).toBe(true);
  });
  it("accepts all-passing environments", () => {
    const errors = validateMeasuredAgainstDeclared(VALID_DECLARED_SAMPLE, { ...base, devices: [{ env: "Chromium", via: "playwright", tier: 3, result: "pass", date: "x" }] }, "t");
    expect(errors).toEqual([]);
  });
  it("reports code changed since the bench commit and ignores metadata, demos and tests (own temp repo: CI clones are shallow)", () => {
    const cwd = process.cwd();
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "fb-stale-"));
    const git = (...args: string[]) => execFileSync("git", ["-c", "core.autocrlf=false", "-c", "user.email=a@b.c", "-c", "user.name=t", ...args], { cwd: tmp, encoding: "utf8" }).trim();
    try {
      const dir = path.join(tmp, "registry", "items", "thing");
      fs.mkdirSync(dir, { recursive: true });
      for (const f of ["thing.tsx", "demo.tsx", "meta.json", "thing.test.tsx"]) fs.writeFileSync(path.join(dir, f), "v1\n");
      git("init", "-q");
      git("add", "-A");
      git("commit", "-q", "-m", "bench commit");
      const bench = git("rev-parse", "HEAD");
      process.chdir(tmp);
      expect(codeChangedSinceBench("thing", bench)).toEqual([]);

      for (const f of ["demo.tsx", "meta.json", "thing.test.tsx"]) fs.writeFileSync(path.join(dir, f), "v2\n");
      git("commit", "-aqm", "metadata, demo and test only");
      expect(codeChangedSinceBench("thing", bench)).toEqual([]);

      fs.writeFileSync(path.join(dir, "thing.tsx"), "v2\n");
      git("commit", "-aqm", "code");
      expect(codeChangedSinceBench("thing", bench)).toEqual(["registry/items/thing/thing.tsx"]);
      expect(codeChangedSinceBench("thing", "0000000")).toBeNull();
    } finally {
      process.chdir(cwd);
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("checkReleaseSnapshots fails when release JSON commit is not an ancestor of HEAD or when item source files changed after commit", async () => {
    const { checkReleaseSnapshots } = await import("../scripts/check-provenance.ts");
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "fb-rel-lint-"));
    const git = (...args: string[]) =>
      execFileSync("git", ["-c", "core.autocrlf=false", "-c", "user.email=a@b.c", "-c", "user.name=t", ...args], {
        cwd: tmp,
        encoding: "utf8",
      }).trim();
    try {
      const itemDir = path.join(tmp, "registry", "items", "ember-core");
      const benchDir = path.join(tmp, "bench", "results", "ember-core");
      fs.mkdirSync(itemDir, { recursive: true });
      fs.mkdirSync(benchDir, { recursive: true });

      fs.writeFileSync(path.join(itemDir, "ember-core.tsx"), "// Original\nexport const v = 1;\n");
      fs.writeFileSync(path.join(itemDir, "demo.tsx"), "// Original\nexport const d = 1;\n");
      fs.writeFileSync(path.join(itemDir, "meta.json"), "{}\n");

      git("init", "-q");
      git("add", "-A");
      git("commit", "-q", "-m", "initial item commit");
      const baseSha = git("rev-parse", "--short=7", "HEAD");

      const makeSnap = (sha: string) => {
        const sz = measureItemSize(itemDir);
        const rawTxt =
          JSON.stringify(
            {
              item: "ember-core",
              commit: sha,
              date: "2026-10-01",
              playwright: {
                specs: [{ file: "bench/specs/a11y.spec.ts", title: "ok", projectName: "chromium-desktop", status: "expected" }],
              },
              probes: [
                {
                  file: "p.json",
                  data: {
                    cls: 0,
                    framesWhenIdle: { offscreen: 0, hiddenTab: 0, reducedMotion: 0 },
                    axe: { serious: 0, critical: 0 },
                  },
                },
              ],
            },
            null,
            2
          ) + "\n";
        fs.mkdirSync(benchDir, { recursive: true });
        fs.writeFileSync(path.join(benchDir, `raw-${sha}.json`), rawTxt);
        return {
          commit: sha,
          treeClean: true,
          resultsHash: hashRawResultsText(rawTxt),
          date: "2026-10-01",
          sizeKB: { initial: sz.initialGzipKB, deferred: sz.deferredGzipKB, method: sz.method },
          cls: 0,
          framesWhenIdle: { offscreen: 0, hiddenTab: 0, reducedMotion: 0 },
          axe: { serious: 0, critical: 0 },
          devices: [
            {
              env: "Chromium Desktop (SwiftShader)",
              via: "playwright",
              tier: 3,
              result: "pass",
              date: "2026-10-01",
              notes: "1 passed, 0 failed",
            },
          ],
        };
      };

      const releaseFile = path.join(benchDir, "release-0.1.0.json");
      const baseSnap = makeSnap(baseSha);
      fs.writeFileSync(releaseFile, JSON.stringify(baseSnap, null, 2));

      // 1 & 2. Clean ancestor commit with subsequent non-source changes (meta.json, demo.tsx) -> passes
      fs.writeFileSync(path.join(itemDir, "meta.json"), '{"updated":true}\n');
      fs.writeFileSync(path.join(itemDir, "demo.tsx"), "// Original\nexport const d = 2;\n");
      git("commit", "-aqm", "update meta and demo only");
      expect(checkReleaseSnapshots(tmp)).toEqual([]);

      // 3. Divergent branch commit (exists in git, but NOT an ancestor of HEAD) -> fails
      const sideSha = git("commit-tree", "HEAD^{tree}", "-m", "side commit").slice(0, 7);

      fs.writeFileSync(releaseFile, JSON.stringify(makeSnap(sideSha), null, 2));
      const nonAncestorViolations = checkReleaseSnapshots(tmp);
      expect(nonAncestorViolations).toHaveLength(1);
      expect(nonAncestorViolations[0].reason).toContain("is not an ancestor of HEAD");

      // 4. Restore valid ancestor commit, then modify item source file -> fails
      fs.writeFileSync(releaseFile, JSON.stringify(baseSnap, null, 2));
      fs.writeFileSync(path.join(itemDir, "ember-core.tsx"), "// Original\nexport const v = 2;\n");
      git("commit", "-aqm", "modify item source after bench commit");
      const sourceChangedViolations = checkReleaseSnapshots(tmp);
      expect(sourceChangedViolations.some((v) => v.reason.includes("Item source file(s) changed after release snapshot commit"))).toBe(true);
      expect(sourceChangedViolations.some((v) => v.reason.includes("registry/items/ember-core/ember-core.tsx"))).toBe(true);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("rejects missing treeClean, shared runtime changes, sizeKB mismatch, and raw-<commit>.json / resultsHash tampering (Audit A6)", async () => {
    const { checkReleaseSnapshots } = await import("../scripts/check-provenance.ts");
    const { verifyItemEvidence } = await import("../scripts/merge-evidence.ts");
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "fb-a6-guard-"));
    const git = (...args: string[]) =>
      execFileSync("git", ["-c", "core.autocrlf=false", "-c", "user.email=a@b.c", "-c", "user.name=t", ...args], {
        cwd: tmp,
        encoding: "utf8",
      }).trim();
    try {
      const itemDir = path.join(tmp, "registry", "items", "test-item");
      const runtimeDir = path.join(tmp, "packages", "runtime", "src");
      const benchRoot = path.join(tmp, "bench", "results");
      const itemBenchDir = path.join(benchRoot, "test-item");
      fs.mkdirSync(itemDir, { recursive: true });
      fs.mkdirSync(runtimeDir, { recursive: true });
      fs.mkdirSync(itemBenchDir, { recursive: true });

      fs.writeFileSync(path.join(itemDir, "test-item.tsx"), "// Original\nexport const v = 1;\n");
      fs.writeFileSync(path.join(itemDir, "meta.declared.json"), JSON.stringify(VALID_DECLARED_SAMPLE, null, 2));
      fs.writeFileSync(path.join(runtimeDir, "frame.ts"), "// Original\nexport const r = 1;\n");

      git("init", "-q");
      git("add", "-A");
      git("commit", "-q", "-m", "initial commit");
      const baseSha = git("rev-parse", "--short=7", "HEAD");

      const liveSize = measureItemSize(itemDir);
      const rawPayload = {
        item: "test-item",
        commit: baseSha,
        date: "2026-10-01",
        playwright: {
          specs: [{ file: "bench/specs/a11y.spec.ts", title: "passes", projectName: "chromium-desktop", status: "expected" }],
        },
        probes: [
          {
            file: "probe-1.json",
            data: {
              cls: 0,
              framesWhenIdle: { offscreen: 0, hiddenTab: 0, reducedMotion: 0 },
              axe: { serious: 0, critical: 0 },
            },
          },
        ],
      };
      const rawText = JSON.stringify(rawPayload, null, 2) + "\n";
      const resultsHash = hashRawResultsText(rawText);
      fs.writeFileSync(path.join(itemBenchDir, `raw-${baseSha}.json`), rawText);

      const validMeasured = {
        commit: baseSha,
        date: "2026-10-01",
        treeClean: true,
        resultsHash,
        sizeKB: { initial: liveSize.initialGzipKB, deferred: liveSize.deferredGzipKB, method: liveSize.method },
        cls: 0,
        framesWhenIdle: { offscreen: 0, hiddenTab: 0, reducedMotion: 0 },
        axe: { serious: 0, critical: 0 },
        devices: [
          {
            env: "Chromium Desktop (SwiftShader)",
            via: "playwright",
            tier: 3,
            result: "pass",
            date: "2026-10-01",
            notes: "1 passed, 0 failed",
          },
        ],
      };

      const releaseFile = path.join(itemBenchDir, "release-0.1.0.json");
      const writeState = (m: any) => {
        fs.writeFileSync(releaseFile, JSON.stringify(m, null, 2));
        fs.writeFileSync(path.join(itemDir, "meta.json"), JSON.stringify({ ...VALID_DECLARED_SAMPLE, measured: m }, null, 2));
      };

      // 2a, 2c-1, 2c-2: Missing treeClean, tampered sizeKB, and tampered cls (mismatch with raw-<commit>.json)
      const tampered = {
        ...validMeasured,
        sizeKB: { ...validMeasured.sizeKB, initial: 99.99 },
        cls: 0.009,
      };
      delete (tampered as any).treeClean;
      writeState(tampered);
      const snapViolations = checkReleaseSnapshots(tmp);
      expect(snapViolations.some((v) => v.reason.includes("treeClean"))).toBe(true);
      expect(snapViolations.some((v) => v.reason.includes("sizeKB"))).toBe(true);
      expect(snapViolations.some((v) => v.reason.includes("raw-"))).toBe(true);
      const verifyTampered = verifyItemEvidence(itemDir, benchRoot, { check: true });
      expect(verifyTampered.ok).toBe(false);
      expect(verifyTampered.errors.some((e) => e.includes("treeClean"))).toBe(true);
      expect(verifyTampered.errors.some((e) => e.includes("sizeKB"))).toBe(true);
      expect(verifyTampered.errors.some((e) => e.includes("raw-"))).toBe(true);

      // 2b. Restore valid state, then modify packages/runtime/src/frame.ts -> must fail both checkReleaseSnapshots and codeChangedSinceBench
      writeState(validMeasured);
      expect(checkReleaseSnapshots(tmp)).toEqual([]);
      expect(verifyItemEvidence(itemDir, benchRoot, { check: true }).ok).toBe(true);

      fs.writeFileSync(path.join(runtimeDir, "frame.ts"), "// Original\nexport const r = 2;\n");
      git("commit", "-aqm", "change shared runtime after bench");
      expect(checkReleaseSnapshots(tmp).some((v) => v.reason.includes("packages/runtime/src/frame.ts"))).toBe(true);
      expect(codeChangedSinceBench("test-item", baseSha, tmp)).toContain("packages/runtime/src/frame.ts");
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});

describe("audit M3: registry build guards", () => {
  it("accepts only normalised targets inside components/ui", () => {
    expect(isSafeRegistryTarget("components/ui/noise-field.tsx")).toBe(true);
    expect(isSafeRegistryTarget("components/ui/noise-field.gl.tsx")).toBe(true);
    for (const bad of [
      "components/ui/../../.env",
      "components/ui/..\\x.tsx",
      "/etc/passwd.ts",
      "C:/x.ts",
      "components/ui/.env",
      "components/ui/a/../b.tsx",
      "components/ui/readme.md",
      "lib/utils.ts",
    ]) {
      expect(isSafeRegistryTarget(bad)).toBe(false);
    }
  });

  it("refuses unpinned or non-allowlisted npm dependencies and URL registry dependencies", () => {
    expect(() => validateItemDependencies("x", { dependencies: { npm: [{ name: "lenis", version: "1.3.26" }] } })).not.toThrow();
    expect(() => validateItemDependencies("x", { dependencies: { npm: [{ name: "lenis", version: "^1.3.26" }] } })).toThrow(/exact version/);
    expect(() => validateItemDependencies("x", { dependencies: { npm: [{ name: "left-pad", version: "1.0.0" }] } })).toThrow(/allowlist/);
    expect(() => validateItemDependencies("x", { dependencies: { registry: ["https://evil.example/r/x.json"] } })).toThrow(/@frictionborn/);
    expect(() => validateItemDependencies("x", { dependencies: { registry: ["@frictionborn/noise-field"] } })).not.toThrow();
  });

  it("buildRegistry fails on a stray dotfile, a non-source file, or a symlink inside an item", () => {
    const cwd = process.cwd();
    for (const kind of ["dotfile", "readme", "symlink"] as const) {
      const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "fb-reg-"));
      try {
        const dir = path.join(tmp, "registry", "items", "thing");
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, "meta.declared.json"), JSON.stringify({ item: { name: "thing", kind: "dom", summary: "s" }, dependencies: {} }));
        fs.writeFileSync(path.join(dir, "thing.tsx"), "export const x = 1;\n");
        if (kind === "dotfile") fs.writeFileSync(path.join(dir, ".env"), "SECRET=1\n");
        if (kind === "readme") fs.writeFileSync(path.join(dir, "README.md"), "# hi\n");
        if (kind === "symlink") {
          fs.writeFileSync(path.join(tmp, "outside.ts"), "export const secret = 1;\n");
          try {
            fs.symlinkSync(path.join(tmp, "outside.ts"), path.join(dir, "link.ts"));
          } catch {
            continue; // no symlink privilege on this machine
          }
        }
        process.chdir(tmp);
        expect(() => buildRegistry()).toThrow(/symlink|not a \.ts\/\.tsx source/);
      } finally {
        process.chdir(cwd);
        fs.rmSync(tmp, { recursive: true, force: true });
      }
    }
  });
});

describe("step 11: agent layer guarantees", () => {
  const root = path.resolve(__dirname, "..");
  const ITEMS = [
    "ambient-hero",
    "distortion-image",
    "magnetic-button",
    "marquee",
    "mesh-gradient",
    "noise-field",
    "particle-field",
    "scroll-reveal",
    "scroll-showcase",
    "smooth-scroll",
    "sticky-scroll-story",
    "text-reveal",
    "ash-text",
    "eclipse-switch",
    "ember-badge",
    "ember-core",
    "firework-rating",
    "flame-switch",
    "flint-button",
    "fuse-toast",
    "hold-to-confirm",
    "lantern-sky",
    "light-leak-tabs",
    "match-progress",
    "temper-slider",
  ];

  it("enforces line budgets on agent entry points", () => {
    const skillPath = path.join(root, "skills", "frictionborn", "SKILL.md");
    expect(fs.existsSync(skillPath)).toBe(true);
    const skillLines = fs.readFileSync(skillPath, "utf8").trim().split("\n").length;
    expect(skillLines).toBeLessThan(150);

    const snippetPath = path.join(root, "agents", "AGENTS.snippet.md");
    expect(fs.existsSync(snippetPath)).toBe(true);
    const snippetLines = fs.readFileSync(snippetPath, "utf8").trim().split("\n").length;
    expect(snippetLines).toBeLessThan(40);

    const llmsPath = path.join(root, "llms.txt");
    expect(fs.existsSync(llmsPath)).toBe(true);
    const llmsLines = fs.readFileSync(llmsPath, "utf8").trim().split("\n").length;
    expect(llmsLines).toBeLessThan(200);
  });

  it("verifies all 25 items have matching spec sheets and catalog entries", () => {
    const catalogPath = path.join(root, "skills", "frictionborn", "references", "catalog.md");
    expect(fs.existsSync(catalogPath)).toBe(true);
    const catalogContent = fs.readFileSync(catalogPath, "utf8");

    for (const name of ITEMS) {
      expect(catalogContent).toContain(`[${name}](items/${name}.md)`);

      const specPath = path.join(root, "skills", "frictionborn", "references", "items", `${name}.md`);
      expect(fs.existsSync(specPath)).toBe(true);
      const specContent = fs.readFileSync(specPath, "utf8");

      const metaPath = path.join(root, "registry", "items", name, "meta.declared.json");
      expect(fs.existsSync(metaPath)).toBe(true);
      const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));

      // Slot and summary match
      expect(specContent).toContain(`- **Slot**: \`${meta.item.slot}\``);

      // Every prop in meta.declared.json is documented in the props table
      for (const prop of meta.props || []) {
        expect(specContent).toContain(`\`${prop.name}\``);
      }

      // Registry dependencies match
      const regDeps = meta.dependencies?.registry || [];
      for (const dep of regDeps) {
        expect(specContent).toContain(`\`${dep}\``);
      }
    }
  });

  it("wires up every spec in bench/specs/ (including paused, mesh-speed, combined-page, stress-gl) into getBenchSpecsForItem (Audit A9)", async () => {
    const { getBenchSpecsForItem, COMBINED_PAGE_ITEMS, STRESS_GL_ITEMS } = await import("../bench/run-bench.ts");
    const specFilesOnDisk = fs
      .readdirSync(path.join(root, "bench", "specs"))
      .filter((f) => f.endsWith(".spec.ts"))
      .map((f) => `bench/specs/${f}`)
      .sort();

    const unionOfWiredSpecs = new Set<string>();
    for (const item of ITEMS) {
      const itemSpecs = getBenchSpecsForItem(item);
      for (const s of itemSpecs) unionOfWiredSpecs.add(s);
      expect(itemSpecs, `${item} must run paused.spec.ts`).toContain("bench/specs/paused.spec.ts");
    }
    expect(getBenchSpecsForItem("dummy")).not.toContain("bench/specs/paused.spec.ts");
    expect(getBenchSpecsForItem("mesh-gradient")).toContain("bench/specs/mesh-speed.spec.ts");
    for (const item of COMBINED_PAGE_ITEMS) {
      expect(getBenchSpecsForItem(item), `${item} must run combined-page.spec.ts`).toContain("bench/specs/combined-page.spec.ts");
    }
    for (const item of STRESS_GL_ITEMS) {
      expect(getBenchSpecsForItem(item), `${item} must run stress-gl.spec.ts`).toContain("bench/specs/stress-gl.spec.ts");
    }
    // No orphan spec files in bench/specs/
    expect([...unionOfWiredSpecs].sort()).toEqual(specFilesOnDisk);
  });

  it("walks full keyboard tab order past 80 stops to the end of the page and fails on missing focus ring or keyboard trap (Audit A10)", async () => {
    const { walkPageKeyboard } = await import("../scripts/verify-v4.ts");

    interface MockEl {
      tagName: string;
      id: string;
      className: string;
      textContent: string;
      style: {
        outlineStyle: string;
        outlineWidth: string;
        boxShadow: string;
        visibility: string;
        display: string;
        opacity: string;
      };
      getAttribute: (name: string) => string | null;
      matches: (sel: string) => boolean;
      scrollIntoView: () => void;
      getBoundingClientRect: () => { width: number; height: number; top: number; bottom: number; left: number; right: number };
      blur: () => void;
    }

    function createMockPage(opts: { totalStops: number; missingRingAt?: number; trapAt?: number; neverWrap?: boolean }) {
      const bodyEl: MockEl = {
        tagName: "BODY",
        id: "",
        className: "",
        textContent: "",
        style: { outlineStyle: "none", outlineWidth: "0px", boxShadow: "none", visibility: "visible", display: "block", opacity: "1" },
        getAttribute: () => null,
        matches: () => false,
        scrollIntoView: () => {},
        getBoundingClientRect: () => ({ width: 1440, height: 900, top: 0, bottom: 900, left: 0, right: 1440 }),
        blur: () => {},
      };

      const elements: MockEl[] = [];
      let activeElement: MockEl | null = bodyEl;

      const makeEl = (i: number, hasRing: boolean): MockEl => ({
        tagName: i === 0 ? "A" : "BUTTON",
        id: i === 0 ? "" : `stop-${i}`,
        className: i === 0 ? "skip-to-content" : "nav-btn",
        textContent: i === 0 ? "Skip to content" : `Action ${i}`,
        style: {
          outlineStyle: hasRing ? "solid" : "none",
          outlineWidth: hasRing ? "2px" : "0px",
          boxShadow: "none",
          visibility: "visible",
          display: "inline-block",
          opacity: "1",
        },
        getAttribute: () => null,
        matches: () => false,
        scrollIntoView: () => {},
        getBoundingClientRect: () => ({ width: 100, height: 36, top: 20, bottom: 56, left: 20, right: 120 }),
        blur: () => {
          activeElement = bodyEl;
        },
      });

      for (let i = 0; i < opts.totalStops; i++) {
        elements.push(makeEl(i, opts.missingRingAt !== i));
      }

      const g = globalThis as Record<string, unknown>;
      g.innerWidth = 1440;
      g.innerHeight = 900;
      g.window = {
        innerWidth: 1440,
        innerHeight: 900,
        scrollTo: () => {},
      };
      g.document = {
        get activeElement() {
          return activeElement;
        },
        body: bodyEl,
        documentElement: bodyEl,
      };
      g.getComputedStyle = (el: MockEl) => el.style;

      let idx = -1;
      return {
        keyboard: {
          press: async (key: string) => {
            if (key !== "Tab") return;
            if (idx === -1) {
              idx = 0;
            } else if (opts.trapAt !== undefined && idx === opts.trapAt) {
              idx = opts.trapAt;
            } else if (idx + 1 < elements.length) {
              idx += 1;
            } else if (opts.neverWrap) {
              elements.push(makeEl(elements.length, true));
              idx = elements.length - 1;
            } else {
              idx = 0;
            }
            activeElement = elements[idx] ?? bodyEl;
          },
        },
        evaluate: async <R, A>(fn: (arg: A) => R, arg?: A): Promise<R> => fn(arg as A),
      };
    }

    // 1. Valid 110-stop page walks all 110 stops to the end and passes
    const validRes = await walkPageKeyboard(createMockPage({ totalStops: 110 }) as never);
    expect(validRes.seen.length).toBe(110);
    expect(validRes.bad).toEqual([]);
    expect(validRes.pass).toBe(true);

    // 2. Missing focus ring at stop #95 (past the old 80-stop cap) is caught
    const noRingRes = await walkPageKeyboard(createMockPage({ totalStops: 110, missingRingAt: 95 }) as never);
    expect(noRingRes.pass).toBe(false);
    expect(noRingRes.bad.some((b) => b.includes("no focus ring") && b.includes("stop-95"))).toBe(true);

    // 3. Keyboard trap at stop #90 is caught
    const trapRes = await walkPageKeyboard(createMockPage({ totalStops: 110, trapAt: 90 }) as never);
    expect(trapRes.pass).toBe(false);
    expect(trapRes.bad.some((b) => /stuck|trap/i.test(b) && b.includes("stop-90"))).toBe(true);
  });

  it("sizes the fresh-app WebGL slot from each item's declared minimum height (Audit A20)", async () => {
    const { generatePage } = await import("../scripts/fresh-apps.ts");
    const pageSrc = generatePage(["noise-field", "particle-field", "mesh-gradient", "ember-core"], "next");

    const slotHeight = (id: string) => {
      const m = pageSrc.match(new RegExp(`data-testid="gl-item-${id}"[^>]*height:\\s*"(\\d+)px"`));
      return m ? Number(m[1]) : null;
    };

    expect(slotHeight("ember-core")).toBe(360);
    expect(slotHeight("noise-field")).toBe(300);
    expect(slotHeight("particle-field")).toBe(240);
    expect(slotHeight("mesh-gradient")).toBe(260);
  });

  it("allows sharp/libvips (LGPL-3.0) only under node_modules/@img/sharp-* and node_modules/sharp, records DECISIONS.md entry, and fails if registry, runtime, or public/r depends on it (Audit A8)", async () => {
    const { scanDependencyLicenses } = await import("../scripts/check-provenance.ts");

    // 1. DECISIONS.md entry with the 4 required facts
    const decisions = fs.readFileSync(path.join(root, "DECISIONS.md"), "utf8");
    expect(decisions).toContain("dev/server-only exception: sharp/libvips (LGPL-3.0)");
    expect(decisions).toMatch(/Next's server-side image optimisation/i);
    expect(decisions).toMatch(/dynamically linked/i);
    expect(decisions).toMatch(/not in any registry item,\s*`@frictionborn\/runtime`\s*or\s*`public\/r`/i);
    expect(decisions).toMatch(/not distributed to library users/i);

    // 2. Allowed under node_modules/@img/sharp-* and node_modules/sharp on clean repo
    const validLicenseMap = {
      "Apache-2.0 AND LGPL-3.0-or-later": [
        {
          name: "@img/sharp-win32-x64",
          versions: ["0.35.5"],
          paths: [path.join(root, "node_modules", ".pnpm", "@img+sharp-win32-x64@0.35.5", "node_modules", "@img", "sharp-win32-x64")],
        },
        {
          name: "sharp",
          versions: ["0.35.5"],
          paths: [path.join(root, "node_modules", ".pnpm", "sharp@0.35.5", "node_modules", "sharp")],
        },
      ],
    };
    expect(scanDependencyLicenses(root, validLicenseMap)).toEqual([]);

    // 3. Disallowed if sharp path is outside node_modules/@img/sharp-* or node_modules/sharp
    const badPathMap = {
      "Apache-2.0 AND LGPL-3.0-or-later": [
        {
          name: "sharp",
          versions: ["0.35.5"],
          paths: [path.join(root, "packages", "runtime", "vendor", "sharp")],
        },
      ],
    };
    const badPathViolations = scanDependencyLicenses(root, badPathMap);
    expect(badPathViolations.some((v) => v.reason.includes("only permitted under node_modules/@img/sharp-* and node_modules/sharp"))).toBe(true);

    // 4. Fails if registry item, @frictionborn/runtime, or public/r ever depends on or imports sharp
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "fb-sharp-guard-"));
    try {
      const runtimeDir = path.join(tmp, "packages", "runtime", "src");
      const itemDir = path.join(tmp, "registry", "items", "sample");
      const publicRDir = path.join(tmp, "public", "r");
      fs.mkdirSync(runtimeDir, { recursive: true });
      fs.mkdirSync(itemDir, { recursive: true });
      fs.mkdirSync(publicRDir, { recursive: true });

      fs.writeFileSync(
        path.join(tmp, "packages", "runtime", "package.json"),
        JSON.stringify({ name: "@frictionborn/runtime", dependencies: { sharp: "0.35.5" } })
      );
      fs.writeFileSync(
        path.join(itemDir, "meta.declared.json"),
        JSON.stringify({ dependencies: { npm: [{ name: "sharp", version: "0.35.5" }] } })
      );
      fs.writeFileSync(path.join(itemDir, "sample.tsx"), 'import sharp from "sharp";\nexport const x = sharp;\n');
      fs.writeFileSync(
        path.join(publicRDir, "sample.json"),
        JSON.stringify({ name: "sample", dependencies: ["@frictionborn/runtime", "sharp"], files: [] })
      );

      const depViolations = scanDependencyLicenses(tmp, {});
      expect(depViolations.some((v) => v.file.includes("packages") && v.reason.includes("sharp"))).toBe(true);
      expect(depViolations.some((v) => v.file.includes("registry") && v.reason.includes("sharp"))).toBe(true);
      expect(depViolations.some((v) => v.file.includes("public") && v.reason.includes("sharp"))).toBe(true);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});
