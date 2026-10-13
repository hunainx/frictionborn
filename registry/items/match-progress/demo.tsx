// Original — Frictionborn Motion MatchProgress demo
"use client";

import React, { useEffect, useRef, useState } from "react";
import { MatchProgress } from "./match-progress";

export default function MatchProgressDemo() {
  const [v, setV] = useState(0);
  const [running, setRunning] = useState(false);
  const timer = useRef<number | null>(null);
  useEffect(() => () => { if (timer.current) window.clearInterval(timer.current); }, []);
  const run = () => {
    setV(0);
    setRunning(true);
    timer.current = window.setInterval(() => {
      setV((p) => {
        const n = Math.min(100, p + 2 + Math.random() * 3);
        if (n >= 100 && timer.current) { window.clearInterval(timer.current); timer.current = null; setRunning(false); }
        return n;
      });
    }, 120);
  };
  return (
    <section aria-label="MatchProgress demo" style={{ maxWidth: 520, margin: "0 auto", padding: "24px 16px", background: "#0c0b0a", color: "#E9E5DF", borderRadius: 18, display: "grid", gap: 14, justifyItems: "center" }}>
      <MatchProgress value={v} label="Running the bench" style={{ width: "100%" }} />
      <button type="button" onClick={run} disabled={running} style={{ minHeight: 34, padding: "0 14px", borderRadius: 999, border: "1px solid rgba(233,229,223,.18)", background: "#1d1a18", color: "#E9E5DF", fontSize: 13, cursor: "pointer" }}>
        {v >= 100 ? "Run the bench again" : "Run the bench"}
      </button>
    </section>
  );
}
