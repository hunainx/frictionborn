// Original — Frictionborn Motion EmberCore demo ("full" interactive mode with controls panel, palette chips, sound, glow and gestures)
"use client";

import React from "react";
import { EmberCore } from "./ember-core";

export default function EmberCoreDemo() {
  return (
    <div style={{ width: "100%", maxWidth: 1080, margin: "0 auto" }}>
      <EmberCore
        interactive="full"
        style={{
          minHeight: 560,
          borderRadius: 18,
          border: "1px solid rgba(255, 235, 220, 0.14)",
        }}
      />
    </div>
  );
}
