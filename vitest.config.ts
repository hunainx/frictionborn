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
    exclude: ["**/node_modules/**", "**/dist/**", "bench/**"],
  },
});
