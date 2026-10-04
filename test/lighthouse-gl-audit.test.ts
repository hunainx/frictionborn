// Original — Frictionborn Motion: the Lighthouse "did the GL actually render?" audit must reject every vacuous run
import { describe, it, expect } from "vitest";
// @ts-expect-error plain ESM used by Lighthouse, no types
import FbGlRan from "../bench/lighthouse/gl-audit.mjs";

const good = {
  installed: true,
  contextsCreated: 2,
  contextsDrawn: 1,
  drawsTotal: 300,
  drawnDuringProbe: 1,
  early: { std: 20, coverage: 1 },
  readback: { std: 35, coverage: 1 },
  canvases: [{ visible: true, inViewport: true }],
};
const run = (a: unknown) => FbGlRan.audit({ FbGl: a }).numericValue;

describe("bench/lighthouse gl-audit", () => {
  it("accepts a sustained run that put real pixels on screen", () => {
    expect(run(good)).toBe(1);
  });
  it("accepts a run the frame guard stopped later, if the early sample saw pixels", () => {
    expect(run({ ...good, readback: null, drawnDuringProbe: 0, canvases: [] })).toBe(1);
  });
  it("rejects: gatherer not installed, no draw calls (poster / tier gate refused), a handful of draws, blank pixels, uniform pixels", () => {
    expect(run(undefined)).toBe(0);
    expect(run({ ...good, installed: false })).toBe(0);
    expect(run({ ...good, contextsDrawn: 0, drawsTotal: 0 })).toBe(0);
    expect(run({ ...good, drawsTotal: 5 })).toBe(0);
    expect(run({ ...good, early: { std: 0, coverage: 0 }, readback: { std: 0, coverage: 0 } })).toBe(0);
    expect(run({ ...good, early: { std: 0, coverage: 1 }, readback: { std: 0.2, coverage: 1 } })).toBe(0);
    expect(run({ ...good, early: { error: "lost" }, readback: { error: "lost" } })).toBe(0);
  });
});
