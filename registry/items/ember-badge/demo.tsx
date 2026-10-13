// Original — Frictionborn Motion EmberBadge demo
"use client";

import React, { useState } from "react";
import { EmberBadge } from "./ember-badge";

const BTN: React.CSSProperties = { minHeight: 34, padding: "0 14px", borderRadius: 999, border: "1px solid rgba(233,229,223,.18)", background: "#1d1a18", color: "#E9E5DF", fontSize: 13, cursor: "pointer" };

export default function EmberBadgeDemo() {
  const [n, setN] = useState(3);
  return (
    <section aria-label="EmberBadge demo" style={{ display: "grid", placeItems: "center", gap: 22, minHeight: 250, padding: "56px 16px 24px", background: "#0c0b0a", color: "#E9E5DF", borderRadius: 18 }}>
      <EmberBadge count={n} label="new notes from the bench">
        <button type="button" aria-label="Notifications" style={{ width: 64, height: 64, borderRadius: 18, display: "grid", placeItems: "center", background: "#1b1816", border: "1px solid rgba(233,229,223,.12)", cursor: "pointer" }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d9cfc4" strokeWidth="1.6" aria-hidden="true">
            <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10 21a2 2 0 0 0 4 0" />
          </svg>
        </button>
      </EmberBadge>
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" style={BTN} onClick={() => setN((v) => Math.min(99, v + 1))}>New note</button>
        <button type="button" style={{ ...BTN, background: "transparent" }} onClick={() => setN(0)}>Mark all read</button>
      </div>
    </section>
  );
}
