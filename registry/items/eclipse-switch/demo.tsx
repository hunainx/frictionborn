// Original — Frictionborn Motion EclipseSwitch demo
"use client";

import React, { useState } from "react";
import { EclipseSwitch } from "./eclipse-switch";

export default function EclipseSwitchDemo() {
  const [dark, setDark] = useState(false);
  return (
    <section aria-label="EclipseSwitch demo" style={{ maxWidth: 520, margin: "0 auto", padding: "24px 16px", display: "grid", gap: 12 }}>
      <EclipseSwitch checked={dark} onCheckedChange={setDark} />
      <p style={{ margin: "0 4px", fontSize: 14, color: "var(--muted-foreground, GrayText)" }}>{dark ? "The site would switch to its dark theme now." : "Switch it to dark mode and watch the moon cross the sun."}</p>
    </section>
  );
}
