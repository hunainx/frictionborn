// Original — Frictionborn Motion Lighthouse gatherer for the poster-only control: the same page and the same GL hook,
// with prefers-reduced-motion emulated through CDP before navigation. Every item then renders its declared
// reduced-motion mode (poster, no WebGL), exactly what a visitor with that setting gets.
import FbGlGatherer from "./gl-gatherer.mjs";

export default class FbGlPosterGatherer extends FbGlGatherer {
  async startInstrumentation(context) {
    await super.startInstrumentation(context);
    await context.driver.defaultSession.sendCommand("Emulation.setEmulatedMedia", {
      features: [{ name: "prefers-reduced-motion", value: "reduce" }],
    });
  }
}
