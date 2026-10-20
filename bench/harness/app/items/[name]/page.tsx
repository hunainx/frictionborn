// Original — Frictionborn Motion bench harness item page
"use client";

import React, { useEffect, useState, use } from "react";
import { pauseAll, resumeAll, useCapability, usePaused } from "@frictionborn/runtime";
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
import LanternSkyDemo from "../../../../../registry/items/lantern-sky/demo";
import AshTextDemo from "../../../../../registry/items/ash-text/demo";
import FireworkRatingDemo from "../../../../../registry/items/firework-rating/demo";
import EclipseSwitchDemo from "../../../../../registry/items/eclipse-switch/demo";
import HoldToConfirmDemo from "../../../../../registry/items/hold-to-confirm/demo";
import FlintButtonDemo from "../../../../../registry/items/flint-button/demo";
import FuseToastDemo from "../../../../../registry/items/fuse-toast/demo";
import MatchProgressDemo from "../../../../../registry/items/match-progress/demo";
import TemperSliderDemo from "../../../../../registry/items/temper-slider/demo";
import LightLeakTabsDemo from "../../../../../registry/items/light-leak-tabs/demo";
import EmberBadgeDemo from "../../../../../registry/items/ember-badge/demo";
import EmberCoreDemo from "../../../../../registry/items/ember-core/demo";
import { EmberCore } from "../../../../../registry/items/ember-core/ember-core";
import FlameSwitchDemo from "../../../../../registry/items/flame-switch/demo";

export default function ItemBenchPage({
  params,
  searchParams,
}: {
  params: Promise<{ name: string }>;
  searchParams: Promise<{ tier?: string; offscreen?: string; leak?: string; cycles?: string; hero?: string }>;
}) {
  const resolvedParams = use(params);
  const resolvedQuery = use(searchParams);
  const name = resolvedParams.name;
  const tier = resolvedQuery.tier;
  const isOffscreen = resolvedQuery.offscreen === "1";
  const isLeakTest = resolvedQuery.leak === "1";
  const isHeroMode = resolvedQuery.hero === "1";

  const [mounted, setMounted] = useState(true);
  const [cycleCount, setCycleCount] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as unknown as { __fbRuntime?: { pauseAll: typeof pauseAll; resumeAll: typeof resumeAll } }).__fbRuntime = {
        pauseAll,
        resumeAll,
      };
    }
    return () => {
      resumeAll();
    };
  }, []);

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

  // From the searchParams prop, not window.location: the server and the client must render the same number
  // (a lazy useState reading window.location printed 50 on the server and 25 on the client: hydration mismatch).
  const parsedCycles = parseInt(resolvedQuery.cycles ?? "", 10);
  const targetCycles = !isNaN(parsedCycles) && parsedCycles > 0 ? parsedCycles : 50;

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
        const isGl = ["noise-field", "particle-field", "mesh-gradient", "ambient-hero", "ember-core"].includes(name);
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
    if (name === "lantern-sky") {
      return <LanternSkyDemo />;
    }
    if (name === "ash-text") {
      return <AshTextDemo />;
    }
    if (name === "firework-rating") {
      return <FireworkRatingDemo />;
    }
    if (name === "eclipse-switch") {
      return <EclipseSwitchDemo />;
    }
    if (name === "hold-to-confirm") {
      return <HoldToConfirmDemo />;
    }
    if (name === "flint-button") {
      return <FlintButtonDemo />;
    }
    if (name === "fuse-toast") {
      return <FuseToastDemo />;
    }
    if (name === "match-progress") {
      return <MatchProgressDemo />;
    }
    if (name === "temper-slider") {
      return <TemperSliderDemo />;
    }
    if (name === "light-leak-tabs") {
      return <LightLeakTabsDemo />;
    }
    if (name === "ember-badge") {
      return <EmberBadgeDemo />;
    }
    if (name === "ember-core") {
      return isHeroMode ? (
        <EmberCore interactive="hero" style={{ minHeight: 520 }}>
          <h1 style={{ margin: 0, fontSize: "2rem" }}>We build what others call impossible.</h1>
        </EmberCore>
      ) : (
        <EmberCoreDemo />
      );
    }
    if (name === "flame-switch") {
      return <FlameSwitchDemo />;
    }
    return (
      <div style={{ padding: "2rem", color: "var(--muted)" }}>
        No demo component registered for {name}
      </div>
    );
  }

  const { tier: runtimeTier } = useCapability();
  const hostPaused = usePaused();
  const displayTier = tier !== undefined ? `T${tier}` : `Auto (T${runtimeTier})`;

  return (
    <div
      data-testid="bench-container"
      data-leak-done={cycleCount >= targetCycles ? "true" : undefined}
      data-fb-tier={tier}
      style={{
        maxWidth: 1000,
        margin: "0 auto",
        minHeight: isOffscreen ? "3500px" : isHeroMode ? "2400px" : "auto",
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
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <button
            type="button"
            data-testid="host-pause"
            aria-pressed={hostPaused}
            onClick={() => (hostPaused ? resumeAll() : pauseAll())}
            style={{
              padding: "0.25rem 0.5rem",
              fontSize: "0.75rem",
              borderRadius: 4,
              border: "1px solid var(--line)",
              background: "transparent",
              color: "var(--ink)",
              cursor: "pointer",
            }}
          >
            {hostPaused ? "Resume motion" : "Pause motion"}
          </button>
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
