// Original — Frictionborn Motion
import { defineConfig } from "vitest/config";

import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^@\/components\/ui\/(.*)$/,
        replacement: path.resolve(__dirname, "registry/items/$1/$1.tsx"),
      },
    ],
  },
  test: {
    exclude: ["**/node_modules/**", "**/dist/**", "bench/**", "scripts/parity-v2.spec.ts", "scripts/parity-v3.spec.ts"], // the parity gates are Playwright specs (pnpm parity:v2, pnpm parity:v3)
  },
});
