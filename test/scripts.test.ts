// Original — Frictionborn Motion script and schema tests
import { describe, it, expect } from "vitest";
import { validateDeclaredMetadata } from "../scripts/validate-meta.ts";
import { validateMeasuredAgainstDeclared } from "../scripts/merge-evidence.ts";
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
    const { default: fs } = await import("node:fs");
    const { default: path } = await import("node:path");
    const { default: os } = await import("node:os");

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "fb-test-evidence-"));
    try {
      const itemDir = path.join(tmpDir, "registry", "test-item");
      const benchDir = path.join(tmpDir, "bench", "results");
      const itemBenchDir = path.join(benchDir, "test-item");
      fs.mkdirSync(itemDir, { recursive: true });
      fs.mkdirSync(itemBenchDir, { recursive: true });

      const measured = {
        commit: "a1b2c3d",
        date: "2026-10-01",
        sizeKB: { initial: 1.5, deferred: 0, method: "gzip-9" },
        cls: 0,
        framesWhenIdle: { offscreen: 0, hiddenTab: 0, reducedMotion: 0 },
        axe: { serious: 0, critical: 0 },
        devices: [],
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
    const { default: fs } = await import("node:fs");
    const { default: path } = await import("node:path");
    const { default: os } = await import("node:os");

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
        devices: [],
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
    const { default: fs } = await import("node:fs");
    const { default: path } = await import("node:path");
    const { default: os } = await import("node:os");

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
        devices: [],
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
