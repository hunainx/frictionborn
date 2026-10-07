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
  }
];
