// Original — Frictionborn Motion multi-component GL budget stress page
"use client";

import React, { useEffect, use } from "react";
import { NoiseField } from "../../../../registry/items/noise-field/noise-field";
import { ParticleField } from "../../../../registry/items/particle-field/particle-field";
import { MeshGradient } from "../../../../registry/items/mesh-gradient/mesh-gradient";

export default function StressGLPage({
  searchParams,
}: {
  searchParams: Promise<{ scroll?: string; tier?: string; dense?: string }>;
}) {
  const resolvedQuery = use(searchParams);
  const isStacked = resolvedQuery.scroll === "1";
  const tier = resolvedQuery.tier;
  const isDense = resolvedQuery.dense === "1";
  const itemHeight = isDense ? "200px" : (isStacked ? "700px" : "200px");

  useEffect(() => {
    if (tier !== undefined) {
      document.documentElement.setAttribute("data-fb-tier", tier);
      return () => {
        document.documentElement.removeAttribute("data-fb-tier");
      };
    }
  }, [tier]);

  return (
    <div
      data-testid="stress-gl-container"
      data-layout={isStacked ? "stacked" : "grid"}
      style={{
        padding: "1rem",
        backgroundColor: "var(--background, #080A0E)",
        color: "var(--foreground, #F1F5F9)",
        minHeight: "100vh",
      }}
    >
      <header style={{ marginBottom: "1rem" }}>
        <h1 style={{ fontSize: "1.25rem", margin: 0 }}>
          Multi-Component WebGL Context Budget Stress Page
        </h1>
        <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.8rem", color: "var(--muted, #94A3B8)" }}>
          2x NoiseField + 2x ParticleField + 2x MeshGradient ({isStacked ? "stacked scrolling layout" : "grid layout"})
        </p>
      </header>

      <div
        style={
          isStacked
            ? { display: "flex", flexDirection: "column", gap: "2rem" }
            : {
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "1rem",
              }
        }
      >
        {/* 1. NoiseField Instance A */}
        <section
          data-testid="gl-item-1"
          style={{
            height: itemHeight,
            borderRadius: "6px",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <NoiseField style={{ width: "100%", height: "100%" }}>
            <div style={{ position: "relative", zIndex: 10, padding: "0.75rem", fontSize: "0.75rem" }}>
              NoiseField 01
            </div>
          </NoiseField>
        </section>

        {/* 2. ParticleField Instance A */}
        <section
          data-testid="gl-item-2"
          style={{
            height: itemHeight,
            borderRadius: "6px",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <ParticleField count={1000} style={{ width: "100%", height: "100%" }}>
            <div style={{ position: "relative", zIndex: 10, padding: "0.75rem", fontSize: "0.75rem" }}>
              ParticleField 01
            </div>
          </ParticleField>
        </section>

        {/* 3. MeshGradient Instance A */}
        <section
          data-testid="gl-item-3"
          style={{
            height: itemHeight,
            borderRadius: "6px",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <MeshGradient style={{ width: "100%", height: "100%" }}>
            <div style={{ position: "relative", zIndex: 10, padding: "0.75rem", fontSize: "0.75rem" }}>
              MeshGradient 01
            </div>
          </MeshGradient>
        </section>

        {/* 4. NoiseField Instance B */}
        <section
          data-testid="gl-item-4"
          style={{
            height: itemHeight,
            borderRadius: "6px",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <NoiseField style={{ width: "100%", height: "100%" }}>
            <div style={{ position: "relative", zIndex: 10, padding: "0.75rem", fontSize: "0.75rem" }}>
              NoiseField 02
            </div>
          </NoiseField>
        </section>

        {/* 5. ParticleField Instance B */}
        <section
          data-testid="gl-item-5"
          style={{
            height: itemHeight,
            borderRadius: "6px",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <ParticleField count={1000} style={{ width: "100%", height: "100%" }}>
            <div style={{ position: "relative", zIndex: 10, padding: "0.75rem", fontSize: "0.75rem" }}>
              ParticleField 02
            </div>
          </ParticleField>
        </section>

        {/* 6. MeshGradient Instance B */}
        <section
          data-testid="gl-item-6"
          style={{
            height: itemHeight,
            borderRadius: "6px",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <MeshGradient style={{ width: "100%", height: "100%" }}>
            <div style={{ position: "relative", zIndex: 10, padding: "0.75rem", fontSize: "0.75rem" }}>
              MeshGradient 02
            </div>
          </MeshGradient>
        </section>
      </div>
    </div>
  );
}
