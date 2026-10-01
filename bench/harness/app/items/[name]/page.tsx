// Original — Frictionborn Motion bench harness item page
"use client";

import React, { useEffect, useState, use } from "react";
import DummyDemo from "../../../../../registry/items/dummy/demo";
import NoiseFieldDemo from "../../../../../registry/items/noise-field/demo";
import TextRevealDemo from "../../../../../registry/items/text-reveal/demo";
import ScrollRevealDemo from "../../../../../registry/items/scroll-reveal/demo";
import MagneticButtonDemo from "../../../../../registry/items/magnetic-button/demo";
import MarqueeDemo from "../../../../../registry/items/marquee/demo";

export default function ItemBenchPage({
  params,
  searchParams,
}: {
  params: Promise<{ name: string }>;
  searchParams: Promise<{ tier?: string; offscreen?: string; leak?: string }>;
}) {
  const resolvedParams = use(params);
  const resolvedQuery = use(searchParams);
  const name = resolvedParams.name;
  const tier = resolvedQuery.tier;
  const isOffscreen = resolvedQuery.offscreen === "1";
  const isLeakTest = resolvedQuery.leak === "1";

  const [mounted, setMounted] = useState(true);
  const [cycleCount, setCycleCount] = useState(0);

  // Set data-fb-tier on root element ONLY when explicitly passed in query
  useEffect(() => {
    if (tier !== undefined) {
      document.documentElement.setAttribute("data-fb-tier", tier);
      return () => {
        document.documentElement.removeAttribute("data-fb-tier");
      };
    }
  }, [tier]);

  // Reset probe listeners at start of leak testing so only component listener growth is measured
  useEffect(() => {
    if (isLeakTest && typeof window !== "undefined") {
      (window as any).__FB_PROBES__?.listenerCounter?.reset();
    }
  }, [isLeakTest]);

  // Leak test cycle: mount/unmount 50 times ending unmounted per PRD 6.0
  useEffect(() => {
    if (isLeakTest && cycleCount < 50) {
      const timer = setTimeout(() => {
        if (cycleCount + 1 >= 50) {
          setMounted(false);
        } else {
          setMounted((m) => !m);
        }
        setCycleCount((c) => c + 1);
      }, 20);
      return () => clearTimeout(timer);
    }
  }, [isLeakTest, cycleCount]);

  function renderDemo() {
    if (name === "dummy") {
      return <DummyDemo />;
    }
    if (name === "noise-field") {
      return <NoiseFieldDemo />;
    }
    if (name === "text-reveal") {
      return <TextRevealDemo />;
    }
    if (name === "scroll-reveal") {
      return <ScrollRevealDemo />;
    }
    if (name === "magnetic-button") {
      return <MagneticButtonDemo />;
    }
    if (name === "marquee") {
      return <MarqueeDemo />;
    }
    return (
      <div style={{ padding: "2rem", color: "var(--muted)" }}>
        No demo component registered for {name}
      </div>
    );
  }

  return (
    <div
      data-testid="bench-container"
      data-leak-done={cycleCount >= 50 ? "true" : undefined}
      data-fb-tier={tier}
      style={{
        maxWidth: 1000,
        margin: "0 auto",
        minHeight: isOffscreen ? "3500px" : "auto",
        position: "relative",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
          paddingBottom: "1rem",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Item Benchmark: {name}</h1>
          <span className="mono" style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
            Tier: {tier} | Offscreen: {isOffscreen ? "Yes" : "No"} | Leak cycles: {cycleCount}/50
          </span>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {["0", "1", "2", "3"].map((t) => (
            <a
              key={t}
              href={`/items/${name}?tier=${t}${isOffscreen ? "&offscreen=1" : ""}`}
              style={{
                padding: "0.25rem 0.5rem",
                fontSize: "0.75rem",
                borderRadius: 4,
                border: "1px solid var(--line)",
                background: tier === t ? "var(--signal)" : "transparent",
                color: tier === t ? "#fff" : "var(--ink)",
              }}
            >
              T{t}
            </a>
          ))}
        </div>
      </div>

      <div
        id="demo-mount-point"
        style={{
          marginTop: isOffscreen ? "2500px" : "0",
          border: "1px solid var(--line)",
          borderRadius: 8,
          background: "var(--surface)",
          overflow: "hidden",
        }}
      >
        {mounted && renderDemo()}
      </div>
    </div>
  );
}
