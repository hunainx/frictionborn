// Original — Frictionborn Motion Lighthouse config: default performance run plus the WebGL-ran record.
export default {
  extends: "lighthouse:default",
  artifacts: [{ id: "FbGl", gatherer: "./gl-gatherer.mjs" }],
  audits: [{ path: "./gl-audit.mjs" }],
  categories: {
    "fb-gl": { title: "Frictionborn WebGL", auditRefs: [{ id: "fb-gl-ran", weight: 0 }] },
  },
  settings: { onlyCategories: ["performance", "fb-gl"] },
};
