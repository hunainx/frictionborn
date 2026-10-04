// Original — Frictionborn Motion 30-image DistortionImage stress harness page
"use client";

import React, { useEffect, useState, use } from "react";
import { DistortionImage } from "../../../../registry/items/distortion-image/distortion-image";

function leasesPossible(): boolean {
  if (!window.matchMedia("(pointer: fine)").matches) return false;
  const gl = document.createElement("canvas").getContext("webgl2");
  if (!gl) return false;
  gl.getExtension("WEBGL_lose_context")?.loseContext();
  return true;
}

// Leases each leak cycle creates before it unmounts.
const LEAK_LEASES_PER_CYCLE = 2;

const IMAGES = [
  { src: "/assets/distortion/art-1.webp", alt: "Wheat Field with Cypresses by Vincent van Gogh" },
  { src: "/assets/distortion/art-2.webp", alt: "Irises by Vincent van Gogh" },
  { src: "/assets/distortion/art-3.webp", alt: "Cypresses by Vincent van Gogh" },
  { src: "/assets/distortion/art-4.webp", alt: "Under the Wave off Kanagawa by Katsushika Hokusai" },
  { src: "/assets/distortion/art-5.webp", alt: "Sunflowers by Vincent van Gogh" },
  { src: "/assets/distortion/art-6.webp", alt: "The Shepherd's Song by Pierre Puvis de Chavannes" },
];

// Generate 30 items cycling through the 6 CC0 artworks
const GALLERY_ITEMS = Array.from({ length: 30 }, (_, index) => {
  const asset = IMAGES[index % IMAGES.length];
  return {
    id: `distortion-stress-${index + 1}`,
    index: index + 1,
    src: asset.src,
    alt: `${asset.alt} (${index + 1}/30)`,
  };
});

export default function StressDistortionPage({
  searchParams,
}: {
  searchParams: Promise<{ tier?: string; leak?: string; cycles?: string }>;
}) {
  const resolvedQuery = use(searchParams);
  const tier = resolvedQuery.tier;
  const isLeakTest = resolvedQuery.leak === "1";

  const [mounted, setMounted] = useState(true);
  const [cycleCount, setCycleCount] = useState(0);
  const [targetCycles, setTargetCycles] = useState(50);

  useEffect(() => {
    if (tier !== undefined) {
      document.documentElement.setAttribute("data-fb-tier", tier);
      return () => {
        document.documentElement.removeAttribute("data-fb-tier");
      };
    }
  }, [tier]);

  useEffect(() => {
    const c = parseInt(resolvedQuery.cycles || "", 10);
    if (!isNaN(c) && c > 0) {
      setTargetCycles(c);
    }
  }, [resolvedQuery.cycles]);

  // Leak cycling: N mount/unmount cycles ending unmounted. Every mounted cycle really acquires leases (it focuses
  // the first images and waits for their canvases) so contexts and textures are created, then unmounts while they are live.
  // Without that the cycles would create nothing and "0 leaked" would prove nothing.
  useEffect(() => {
    if (!isLeakTest || cycleCount >= targetCycles) return;
    let cancelled = false;
    const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
    (async () => {
      if (!mounted) {
        await sleep(30);
        if (!cancelled) setMounted(true);
        return;
      }
      // Touch pointers, reduced motion and browsers without WebGL2 never get a lease by design: do not wait for one.
      const canLease = leasesPossible();
      const targets = Array.from(
        document.querySelectorAll<HTMLElement>("[data-leak-link]")
      ).slice(0, canLease ? LEAK_LEASES_PER_CYCLE : 0);
      // Let mount effects settle (StrictMode runs them twice in dev), then deliver a real focus event to each link per Decision 24.
      await sleep(60);
      if (cancelled) return;
      targets.forEach((t) => {
        t.blur();
        t.focus();
      });
      const deadline = performance.now() + 2000;
      while (
        !cancelled &&
        performance.now() < deadline &&
        document.querySelectorAll("[data-frictionborn-item] canvas").length < targets.length
      ) {
        await sleep(20);
      }
      if (cancelled) return;
      setMounted(false);
      setCycleCount((c) => c + 1);
    })();
    return () => {
      cancelled = true;
    };
  }, [isLeakTest, mounted, cycleCount, targetCycles]);

  return (
    <div
      data-testid="stress-distortion-container"
      data-leak-done={cycleCount >= targetCycles ? "true" : undefined}
      style={{
        padding: "1.5rem",
        backgroundColor: "var(--background, #080A0E)",
        color: "var(--foreground, #F1F5F9)",
        minHeight: "100vh",
        maxWidth: "1400px",
        margin: "0 auto",
      }}
    >
      <header
        style={{
          borderBottom: "1px solid var(--line, rgba(255, 255, 255, 0.1))",
          paddingBottom: "1rem",
          marginBottom: "1.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 600, margin: 0 }}>
            DistortionImage 30-Image Stress Test
          </h1>
          <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.85rem", color: "var(--muted, #94A3B8)" }}>
            30 instances across 6 CC0 artworks &bull; WebGL context ceiling &le; 4 (desktop) / &le; 2 (mobile)
          </p>
        </div>
        <div style={{ fontSize: "0.8rem", color: "var(--muted, #94A3B8)" }}>
          Cycles: {cycleCount}/{targetCycles} {isLeakTest && "(Leak test mode)"}
        </div>
      </header>

      {mounted && (
        <div
          data-testid="distortion-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {GALLERY_ITEMS.map((item) => (
            <div
              key={item.id}
              data-testid={`stress-item-${item.index}`}
              style={{
                borderRadius: "8px",
                overflow: "hidden",
                border: "1px solid var(--line, rgba(255, 255, 255, 0.08))",
                backgroundColor: "rgba(255, 255, 255, 0.02)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: "220px",
                  backgroundColor: "rgba(0, 0, 0, 0.2)",
                }}
              >
                <a
                  href={`#item-${item.index}`}
                  data-leak-link
                  style={{ display: "block", width: "100%", height: "100%", textDecoration: "none" }}
                >
                  <DistortionImage
                    src={item.src}
                    alt={item.alt}
                    style={{ width: "100%", height: "100%" }}
                    imgStyle={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </a>
              </div>
              <div style={{ padding: "0.75rem 1rem", fontSize: "0.8rem", display: "flex", justifyContent: "space-between" }}>
                <span>Item #{item.index}</span>
                <span style={{ color: "var(--muted, #94A3B8)" }}>The Met Open Access</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
