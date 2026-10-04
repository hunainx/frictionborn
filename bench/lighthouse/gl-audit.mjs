// Original — Frictionborn Motion Lighthouse audit: turns the WebGL gatherer's artifact into a pass/fail record.
// numericValue: 1 = WebGL rendered real pixels during the run, 0 = it did not.

export default class FbGlRan {
  static get meta() {
    return {
      id: "fb-gl-ran",
      title: "WebGL rendered during the run",
      failureTitle: "WebGL did not render during the run",
      description: "Frictionborn: a live WebGL composition was loaded and drew non-blank frames.",
      requiredArtifacts: ["FbGl"],
    };
  }

  static audit(artifacts) {
    const a = artifacts.FbGl;
    // "Ran" = a context issued a sustained run of draw calls (>= 30 frames) AND real, non-uniform pixels were read back,
    // either from the 4x4 sample taken >= 1.2 s into the run or from the full frame read after the trace closed.
    const lit = (r) => !!r && !r.error && r.coverage > 0.5 && r.std > 1;
    const ran = !!a && a.installed && a.contextsDrawn >= 1 && a.drawsTotal >= 30 && (lit(a.early) || lit(a.readback));
    return {
      score: ran ? 1 : 0,
      numericValue: ran ? 1 : 0,
      numericUnit: "unitless",
      details: { type: "debugdata", ...a },
    };
  }
}
