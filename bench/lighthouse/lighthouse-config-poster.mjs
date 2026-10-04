// Original — Frictionborn Motion Lighthouse config for the poster-only control (reduced motion emulated).
import live from "./lighthouse-config.mjs";

export default { ...live, artifacts: [{ id: "FbGl", gatherer: "./gl-gatherer-poster.mjs" }] };
