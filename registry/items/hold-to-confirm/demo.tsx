// Original — Frictionborn Motion HoldToConfirm demo
"use client";

import React from "react";
import { HoldToConfirm } from "./hold-to-confirm";

export default function HoldToConfirmDemo() {
  return (
    <section aria-label="HoldToConfirm demo" style={{ display: "grid", placeItems: "center", gap: 16, minHeight: 250, padding: "40px 16px", background: "#0c0b0a", color: "#E9E5DF", borderRadius: 18 }}>
      <HoldToConfirm confirmedText="Draft deleted." undoLabel="Undo">
        Hold to delete “ember-notes.md”
      </HoldToConfirm>
      <p style={{ margin: 0, fontSize: 14, color: "#a39d97" }}>Press and hold for one second, or hold Enter.</p>
    </section>
  );
}
