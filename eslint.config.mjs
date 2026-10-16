import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default [
  {
    ignores: [
      "**/dist/**",
      "dist/**",
      "**/.next/**",
      "**/node_modules/**",
      "**/coverage/**",
      "**/bench/results/**",
      "bench/harness/public/**",
      "docs/**",
      ".agents/**",
      ".claude/**",
      "_reference/**",
      "**/_reference/**",
      "scratch/**"
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  reactHooks.configs.flat.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }],
      "no-unused-vars": "off",
      "no-undef": "off",
      "no-empty": "warn"
    }
  },
  {
    // typescript-eslint@8.56.0, approved by the owner on 2026-10-13 (DECISIONS 45): the full recommended set applies again (until then
    // no-explicit-any, no-empty-object-type, no-this-alias and no-require-imports were switched off for the whole repo). The files below
    // already broke two of those rules before the approval (196 findings, listed with counts per file in docs/audit/v3/round-2.md); they
    // stay at warning level until they are fixed one by one. Every other file, and every new file, gets the rules as errors.
    files: [
      "the-private-website-repo/app/brand-lab/v2/gate-engine.ts",
      "the-private-website-repo/components/item-preview.tsx",
      "the-private-website-repo/lib/registry-data.ts",
      "bench/harness/app/items/\\[name\\]/page.tsx",
      "bench/lighthouse/run.ts",
      "bench/probes/context-counter.ts",
      "bench/probes/frame-counter.ts",
      "bench/probes/listener-counter.ts",
      "bench/probes/performance-observer.ts",
      "bench/run-bench.ts",
      "bench/specs/ambient-hero.spec.ts",
      "bench/specs/context-loss.spec.ts",
      "bench/specs/distortion-image.spec.ts",
      "bench/specs/mesh-speed.spec.ts",
      "bench/specs/paused.spec.ts",
      "bench/specs/text-reveal-flash.spec.ts",
      "packages/runtime/src/capability.ts",
      "packages/runtime/test/capability.test.ts",
      "packages/runtime/test/gl-budget.test.ts",
      "packages/runtime/test/gl-surface.test.ts",
      "packages/runtime/test/in-view.test.ts",
      "packages/runtime/test/motion-ready.test.tsx",
      "packages/runtime/test/reduced-motion.test.ts",
      "scripts/build-catalog.ts",
      "scripts/build-registry.ts",
      "scripts/check-provenance.ts",
      "scripts/fresh-apps.ts",
      "scripts/merge-evidence.ts",
      "scripts/parity-v2.spec.ts",
      "scripts/validate-meta.ts",
      "scripts/verify-brand-lab.ts",
      "scripts/verify-docs.ts",
      "scripts/verify-v2.ts",
      "test/distortion-image.test.tsx",
      "test/fresh-app-all-items.test.tsx",
      "test/noise-field-frame-guard.test.tsx",
      "test/noise-field-render-loop.test.tsx",
      "test/refs-and-handlers.test.tsx",
      "test/scripts.test.ts",
      "test/site-header-storage.test.tsx",
      "test/smooth-scroll.test.tsx",
      "test/vite-smoke.test.tsx",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-this-alias": "warn"
    }
  },
  {
    // Ported owner prototype code. It is kept line-for-line so it can be diffed against _reference/prototypes (see
    // the-private-website-repo/lib/fire-engine/PORTING.md). Only these three rules are relaxed, only for these .js files: the
    // prototype writes `a && a()`, has unused callback parameters and empty catch blocks. Everything else still applies.
    files: ["the-private-website-repo/lib/fire-engine/**/*.js"],
    rules: {
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "no-empty": "off"
    }
  },
  {
    // eslint-plugin-react-hooks@7.1.1 (DECISIONS 62): distortion-image.tsx deduplicates its dev-only strength range warning via
    // warnedStrengthRef during render, and is locked to its committed release bench SHA by scripts/merge-evidence.ts.
    files: ["registry/items/distortion-image/distortion-image.tsx"],
    rules: {
      "react-hooks/refs": "warn"
    }
  }
];
