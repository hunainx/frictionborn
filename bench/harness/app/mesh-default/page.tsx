// Original — Frictionborn Motion bench harness: MeshGradient with NO props, to test its default behaviour
"use client";

import React, { useEffect } from "react";
import { MeshGradient } from "../../../../registry/items/mesh-gradient/mesh-gradient";

export default function MeshDefaultPage() {
  useEffect(() => {
    document.documentElement.setAttribute("data-fb-tier", "3");
    return () => document.documentElement.removeAttribute("data-fb-tier");
  }, []);
  return (
    <div style={{ position: "relative", width: "100%", height: 420 }}>
      <MeshGradient data-testid="subject" style={{ position: "absolute", inset: 0 }} />
    </div>
  );
}
