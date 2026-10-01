// Original — Frictionborn Motion
import { defineConfig } from "tsdown";

export default defineConfig([
  {
    entry: ["src/index.ts"],
    format: ["esm"],
    dts: true,
    clean: true,
    banner: {
      js: '"use client";',
    },
  },
  {
    entry: ["src/server.ts"],
    format: ["esm"],
    dts: true,
    // Server entry has NO "use client"
  },
  {
    entry: ["src/gl/surface.ts"],
    format: ["esm"],
    dts: true,
    outDir: "dist/gl",
  },
]);
