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
      {
        find: /^@\/lib\/(.*)$/,
      },
      {
        find: /^@frictionborn\/runtime\/gl$/,
        replacement: path.resolve(__dirname, "packages/runtime/src/gl/surface.ts"),
      },
      {
        find: /^@frictionborn\/runtime\/canvas$/,
        replacement: path.resolve(__dirname, "packages/runtime/src/canvas/index.ts"),
      },
      {
        find: /^@frictionborn\/runtime\/server$/,
        replacement: path.resolve(__dirname, "packages/runtime/src/server.ts"),
      },
      {
        find: /^@frictionborn\/runtime$/,
        replacement: path.resolve(__dirname, "packages/runtime/src/index.ts"),
      },
    ],
  },
  test: {
    exclude: ["**/node_modules/**", "**/dist/**", "bench/**", "scripts/parity-v2.spec.ts", "scripts/parity-v3.spec.ts", "scripts/browsers.spec.ts", "scripts/spark.spec.ts", "scripts/flames.spec.ts", "scripts/prelaunch.spec.ts"], // Playwright specs: the parity gates (pnpm parity:v2, pnpm parity:v3), cross-browser checks (playwright.browsers.config.ts) and Studio/prelaunch specs
  },
});
