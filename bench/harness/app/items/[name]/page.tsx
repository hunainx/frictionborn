// Original — Frictionborn Motion bench harness item page
"use client";

import React, { useEffect, useState, use } from "react";
import { useCapability } from "@frictionborn/runtime";
import DummyDemo from "../../../../../registry/items/dummy/demo";
import NoiseFieldDemo from "../../../../../registry/items/noise-field/demo";
import TextRevealDemo from "../../../../../registry/items/text-reveal/demo";
import ScrollRevealDemo from "../../../../../registry/items/scroll-reveal/demo";
import MagneticButtonDemo from "../../../../../registry/items/magnetic-button/demo";
import MarqueeDemo from "../../../../../registry/items/marquee/demo";
import SmoothScrollDemo from "../../../../../registry/items/smooth-scroll/demo";
import StickyScrollStoryDemo from "../../../../../registry/items/sticky-scroll-story/demo";
import ParticleFieldDemo from "../../../../../registry/items/particle-field/demo";
import MeshGradientDemo from "../../../../../registry/items/mesh-gradient/demo";
import DistortionImageDemo from "../../../../../registry/items/distortion-image/demo";
import AmbientHeroDemo from "../../../../../registry/items/ambient-hero/demo";
import ScrollShowcaseDemo from "../../../../../registry/items/scroll-showcase/demo";

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

  const [targetCycles, setTargetCycles] = useState(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      const c = parseInt(p.get("cycles") || "", 10);
      if (!isNaN(c) && c > 0) return c;
    }
    return 50;
  });

  // Leak test cycle: mount/unmount cycles ending unmounted per PRD 6.0
  useEffect(() => {
    if (!isLeakTest) return;
    let active = true;
    const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

    (async () => {
      for (let i = 0; i < targetCycles; i++) {
        if (!active) break;
        setMounted(false);
        await sleep(20);
        if (!active) break;
        setMounted(true);

        // If mounted, wait for canvas to appear if this is a WebGL item, up to a reasonable deadline,
        // ensuring contexts are actually created on all browser engines (including WebKit) before unmounting.
        const isGl = ["noise-field", "particle-field", "mesh-gradient", "ambient-hero"].includes(name);
        if (isGl) {
          const deadline = performance.now() + 1000;
          while (active && performance.now() < deadline && !document.querySelector("#demo-mount-point canvas")) {
            await sleep(16);
          }
        } else {
          await sleep(16);
        }

        if (!active) break;
        setCycleCount(i + 1);
      }

      if (active) {
        setMounted(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [isLeakTest, targetCycles, name]);

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
    if (name === "smooth-scroll") {
      return <SmoothScrollDemo />;
    }
    if (name === "sticky-scroll-story") {
      return <StickyScrollStoryDemo />;
    }
    if (name === "particle-field") {
      return <ParticleFieldDemo />;
    }
    if (name === "mesh-gradient") {
      return <MeshGradientDemo />;
    }
    if (name === "distortion-image") {
      return <DistortionImageDemo />;
    }
    if (name === "ambient-hero") {
      return <AmbientHeroDemo />;
    }
    if (name === "scroll-showcase") {
      return <ScrollShowcaseDemo />;
    }
    return (
      <div style={{ padding: "2rem", color: "var(--muted)" }}>
        No demo component registered for {name}
      </div>
    );
  }

  const { tier: runtimeTier } = useCapability();
  const displayTier = tier !== undefined ? `T${tier}` : `Auto (T${runtimeTier})`;

  return (
    <div
      data-testid="bench-container"
      data-leak-done={cycleCount >= targetCycles ? "true" : undefined}
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
          <span style={{ fontSize: "1.25rem", fontWeight: 600, display: "block" }}>
            Item Benchmark: {name}
          </span>
          <span className="mono" style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
            Tier: {displayTier} | Offscreen: {isOffscreen ? "Yes" : "No"} | Leak cycles: {cycleCount}/{targetCycles}
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
