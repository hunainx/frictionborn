// Original — Frictionborn Motion
import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts", "src/gl/surface.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
});
