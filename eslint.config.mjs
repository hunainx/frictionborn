import js from "@eslint/js";
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
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }],
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-this-alias": "off",
      "@typescript-eslint/no-require-imports": "off",
      "no-unused-vars": "off",
      "no-undef": "off",
      "no-empty": "warn"
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
  }
];
