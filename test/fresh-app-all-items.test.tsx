// Original — Frictionborn Motion: fresh-app check of all 9 items with default props in light & dark
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import React from "react";
import { render, act } from "@testing-library/react";

import { NoiseField } from "../registry/items/noise-field/noise-field";
import { ParticleField } from "../registry/items/particle-field/particle-field";
import { MeshGradient } from "../registry/items/mesh-gradient/mesh-gradient";
import { TextReveal } from "../registry/items/text-reveal/text-reveal";
import { ScrollReveal } from "../registry/items/scroll-reveal/scroll-reveal";
import { MagneticButton } from "../registry/items/magnetic-button/magnetic-button";
import { Marquee } from "../registry/items/marquee/marquee";
import { SmoothScroll } from "../registry/items/smooth-scroll/smooth-scroll";
import { StickyScrollStory } from "../registry/items/sticky-scroll-story/sticky-scroll-story";

function applyShadcnTheme(theme: "light" | "dark") {
  const root = document.documentElement;
  if (theme === "light") {
    root.classList.add("light");
    root.classList.remove("dark");
    root.style.setProperty("--background", "#ffffff");
    root.style.setProperty("--foreground", "#020817");
    root.style.setProperty("--primary", "#0f172a");
    root.style.setProperty("--primary-foreground", "#f8fafc");
    root.style.setProperty("--muted", "#f1f5f9");
    root.style.setProperty("--muted-foreground", "#64748b");
    root.style.setProperty("--border", "#e2e8f0");
    root.style.setProperty("--card", "#ffffff");
    root.style.setProperty("--accent", "#f1f5f9");
    root.style.setProperty("--chart-1", "#e76e50");
    root.style.setProperty("--chart-2", "#2a9d90");
  } else {
    root.classList.add("dark");
    root.classList.remove("light");
    root.style.setProperty("--background", "#020817");
    root.style.setProperty("--foreground", "#f8fafc");
    root.style.setProperty("--primary", "#f8fafc");
    root.style.setProperty("--primary-foreground", "#0f172a");
    root.style.setProperty("--muted", "#1e293b");
    root.style.setProperty("--muted-foreground", "#94a3b8");
    root.style.setProperty("--border", "#1e293b");
    root.style.setProperty("--card", "#020817");
    root.style.setProperty("--accent", "#1e293b");
    root.style.setProperty("--chart-1", "#2662d9");
    root.style.setProperty("--chart-2", "#2eb88a");
  }
}

describe("Fresh-app check of all 9 items with default props (light and dark)", () => {
  beforeEach(() => {
    if (typeof global.ResizeObserver === "undefined") {
      global.ResizeObserver = class {
        observe() {}
        unobserve() {}
        disconnect() {}
      } as any;
    }

    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true,
    })) as any;
  });

  for (const theme of ["light", "dark"] as const) {
    describe(`${theme} theme with real shadcn tokens`, () => {
      beforeEach(() => {
        applyShadcnTheme(theme);
      });

      it("mounts NoiseField with default props without errors", async () => {
        const { container, unmount } = render(<NoiseField />);
        await act(async () => {
          await new Promise((r) => setTimeout(r, 50));
        });
        expect(container.querySelector("[data-frictionborn-item='noise-field']")).not.toBeNull();
        unmount();
      });

      it("mounts ParticleField with default props without errors", async () => {
        const { container, unmount } = render(<ParticleField />);
        await act(async () => {
          await new Promise((r) => setTimeout(r, 50));
        });
        expect(container.querySelector("[data-frictionborn-item='particle-field']")).not.toBeNull();
        unmount();
      });

      it("mounts MeshGradient with default props without errors", async () => {
        const { container, unmount } = render(<MeshGradient />);
        await act(async () => {
          await new Promise((r) => setTimeout(r, 50));
        });
        expect(container.querySelector("[data-frictionborn-item='mesh-gradient']")).not.toBeNull();
        unmount();
      });

      it("mounts TextReveal with default props without errors", async () => {
        const { container, unmount } = render(<TextReveal>Aetheric Observatory</TextReveal>);
        expect(container.textContent).toContain("Aetheric Observatory");
        unmount();
      });

      it("mounts ScrollReveal with default props without errors", async () => {
        const { container, unmount } = render(
          <ScrollReveal>
            <div>Sensor Array Calibrated</div>
          </ScrollReveal>
        );
        expect(container.textContent).toContain("Sensor Array Calibrated");
        unmount();
      });

      it("mounts MagneticButton with default props without errors", async () => {
        const { container, unmount } = render(
          <MagneticButton>
            <button type="button">Engage Drives</button>
          </MagneticButton>
        );
        expect(container.querySelector("button")).not.toBeNull();
        expect(container.textContent).toContain("Engage Drives");
        unmount();
      });

      it("mounts Marquee with default props without errors", async () => {
        const { container, unmount } = render(
          <Marquee>
            <span>Telemetry Channel 01</span>
            <span>Telemetry Channel 02</span>
          </Marquee>
        );
        expect(container.textContent).toContain("Telemetry Channel 01");
        unmount();
      });

      it("mounts SmoothScroll with default props without errors", async () => {
        const { container, unmount } = render(
          <SmoothScroll>
            <div>Main Document Body</div>
          </SmoothScroll>
        );
        expect(container.textContent).toContain("Main Document Body");
        unmount();
      });

      it("mounts StickyScrollStory with default props without errors", async () => {
        const { container, unmount } = render(
          <StickyScrollStory
            steps={[
              {
                id: "step-1",
                title: "Optical Trap",
                description: "Cesium fountain trap stabilization",
                media: { content: <div>Trap Schematic</div> },
              },
            ]}
          />
        );
        expect(container.textContent).toContain("Optical Trap");
        expect(container.textContent).toContain("Cesium fountain trap stabilization");
        unmount();
      });
    });
  }
});
