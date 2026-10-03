// Original — Frictionborn Motion multi-component GL budget stress page
"use client";

import React from "react";
import { NoiseField } from "../../../../registry/items/noise-field/noise-field";
import { ParticleField } from "../../../../registry/items/particle-field/particle-field";
import { MeshGradient } from "../../../../registry/items/mesh-gradient/mesh-gradient";

export default function StressGLPage() {
  return (
    <div
      data-testid="stress-gl-container"
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
          2x NoiseField + 2x ParticleField + 2x MeshGradient concurrent mount
        </p>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1rem",
        }}
      >
        {/* 1. NoiseField Instance A */}
        <div style={{ height: "200px", borderRadius: "6px", overflow: "hidden", position: "relative" }}>
          <NoiseField
            colors={["#080A0E", "#38BDF8", "#818CF8"]}
            style={{ width: "100%", height: "100%" }}
          >
            <div style={{ position: "relative", zIndex: 10, padding: "0.75rem", fontSize: "0.75rem" }}>
              NoiseField 01
            </div>
          </NoiseField>
        </div>

        {/* 2. NoiseField Instance B */}
        <div style={{ height: "200px", borderRadius: "6px", overflow: "hidden", position: "relative" }}>
          <NoiseField
            colors={["#0B0E14", "#F59E0B", "#EF4444"]}
            style={{ width: "100%", height: "100%" }}
          >
            <div style={{ position: "relative", zIndex: 10, padding: "0.75rem", fontSize: "0.75rem" }}>
              NoiseField 02
            </div>
          </NoiseField>
        </div>

        {/* 3. ParticleField Instance A */}
        <div style={{ height: "200px", borderRadius: "6px", overflow: "hidden", position: "relative" }}>
          <ParticleField
            color="#38BDF8"
            count={1000}
            style={{ width: "100%", height: "100%" }}
          >
            <div style={{ position: "relative", zIndex: 10, padding: "0.75rem", fontSize: "0.75rem" }}>
              ParticleField 01
            </div>
          </ParticleField>
        </div>

        {/* 4. ParticleField Instance B */}
        <div style={{ height: "200px", borderRadius: "6px", overflow: "hidden", position: "relative" }}>
          <ParticleField
            color="#A855F7"
            count={1000}
            style={{ width: "100%", height: "100%" }}
          >
            <div style={{ position: "relative", zIndex: 10, padding: "0.75rem", fontSize: "0.75rem" }}>
              ParticleField 02
            </div>
          </ParticleField>
        </div>

        {/* 5. MeshGradient Instance A */}
        <div style={{ height: "200px", borderRadius: "6px", overflow: "hidden", position: "relative" }}>
          <MeshGradient
            colors={["#080A0E", "#06B6D4", "#3B82F6", "#1E293B"]}
            style={{ width: "100%", height: "100%" }}
          >
            <div style={{ position: "relative", zIndex: 10, padding: "0.75rem", fontSize: "0.75rem" }}>
              MeshGradient 01
            </div>
          </MeshGradient>
        </div>

        {/* 6. MeshGradient Instance B */}
        <div style={{ height: "200px", borderRadius: "6px", overflow: "hidden", position: "relative" }}>
          <MeshGradient
            colors={["#0B0E14", "#EC4899", "#8B5CF6", "#1E293B"]}
            style={{ width: "100%", height: "100%" }}
          >
            <div style={{ position: "relative", zIndex: 10, padding: "0.75rem", fontSize: "0.75rem" }}>
              MeshGradient 02
            </div>
          </MeshGradient>
        </div>
      </div>
    </div>
  );
}
