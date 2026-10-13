// Original — Frictionborn Motion FireworkRating demo
"use client";

import React, { useState } from "react";
import { FireworkRating } from "./firework-rating";

export default function FireworkRatingDemo() {
  const [r, setR] = useState(0);
  return (
    <section aria-label="FireworkRating demo" style={{ display: "grid", placeItems: "center", gap: 14, minHeight: 250, padding: "48px 16px 24px", background: "#05060a", color: "#E9E5DF", borderRadius: 18 }}>
      <FireworkRating label="How did the bench feel?" value={r} onValueChange={setR} />
      <p style={{ margin: 0, fontSize: 14, color: "#a39d97" }}>A real radio group: hover to preview, click to rate, or use the arrow keys.</p>
    </section>
  );
}
