import js from "@eslint/js";

export default [
  {
    ignores: [
      "**/dist/**",
      "dist/**",
      "**/.next/**",
      "**/node_modules/**",
      "**/coverage/**",
      "**/bench/results/**",
      ".agents/**",
      ".claude/**",
      "scratch/**"
    ]
  },
  js.configs.recommended,
  {
    rules: {
      "no-unused-vars": ["warn", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }],
      "no-undef": "off",
      "no-empty": "warn"
    }
  }
];
