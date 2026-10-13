// Original — Frictionborn Motion LanternSky demo
"use client";

import React from "react";
import { LanternSky } from "./lantern-sky";

export default function LanternSkyDemo() {
  return (
    <section aria-label="LanternSky demo" style={{ maxWidth: 960, margin: "0 auto", padding: "16px" }}>
      <LanternSky style={{ minHeight: 320, borderRadius: 18 }}>
        <div style={{ padding: "26px 26px 64px" }}>
          <h2 style={{ margin: 0, fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: "italic", fontWeight: 400, fontSize: 44, lineHeight: 1 }}>Let it rise.</h2>
          <p style={{ margin: "10px 0 0", fontSize: 14, color: "#cdbfb1", maxWidth: "40ch" }}>A calm background for a closing section. Move your pointer through the sky: it is a warm breeze.</p>
        </div>
      </LanternSky>
    </section>
  );
}
