// Original — Frictionborn Motion harness page: AmbientHero inside SmoothScroll (the pause button must not freeze scrolling)
"use client";

import React from "react";
import { SmoothScroll } from "../../../../registry/items/smooth-scroll/smooth-scroll";
import { AmbientHero } from "../../../../registry/items/ambient-hero/ambient-hero";

export default function HeroSmoothPage() {
  return (
    <SmoothScroll>
      <AmbientHero
        headline="Precision acoustic geometry engineered for pristine isolation."
        body="Kona creates modular acoustic barriers for production studios and quiet spaces."
        primaryCta={{ label: "Explore Systems", href: "#systems" }}
      />
      <div style={{ height: 3000, padding: "2rem" }}>
        <p>Scrollable content below the hero.</p>
      </div>
    </SmoothScroll>
  );
}
