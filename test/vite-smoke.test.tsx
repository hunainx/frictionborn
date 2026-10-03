// Original — Frictionborn Motion Vite + React client smoke test
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import React from "react";
import { render } from "@testing-library/react";

// Test importing every public API from the package root (default browser/client condition)
import {
  useReducedMotion,
  useCapability,
  useHydrated,
  useInView,
  useFrame,
  useFrameGuard,
  glBudget,
  pauseAll,
  resumeAll,
  usePaused,
  MotionReadyScript,
  initMotionReady,
  tokens,
} from "@frictionborn/runtime";

import { createSurface } from "@frictionborn/runtime/gl";
import { TextReveal } from "../registry/items/text-reveal/text-reveal";
import { ScrollReveal } from "../registry/items/scroll-reveal/scroll-reveal";

describe("Plain Vite + React client smoke test", () => {
  it("exports every runtime hook and utility under the default condition", () => {
    expect(typeof useReducedMotion).toBe("function");
    expect(typeof useCapability).toBe("function");
    expect(typeof useHydrated).toBe("function");
    expect(typeof useInView).toBe("function");
    expect(typeof useFrame).toBe("function");
    expect(typeof useFrameGuard).toBe("function");
    expect(typeof pauseAll).toBe("function");
    expect(typeof resumeAll).toBe("function");
    expect(typeof usePaused).toBe("function");
    expect(typeof glBudget.acquire).toBe("function");
    expect(typeof tokens).toBe("object");
    expect(tokens.duration.fast).toBe(150);
    expect(typeof createSurface).toBe("function");
    expect(typeof initMotionReady).toBe("function");
  });

  it("allows MotionReadyScript and hooks to be used in client components simultaneously", () => {
    function ViteApp() {
      const reduced = useReducedMotion();
      const hydrated = useHydrated();
      return (
        <div>
          <MotionReadyScript nonce="vite-nonce" />
          <span data-testid="status">
            {hydrated ? "hydrated" : "unhydrated"}-{reduced ? "reduced" : "normal"}
          </span>
        </div>
      );
    }

    const { getByTestId, container } = render(<ViteApp />);
    expect(getByTestId("status")).toBeDefined();
    const script = container.querySelector("script");
    expect(script).not.toBeNull();
    expect(script?.getAttribute("nonce")).toBe("vite-nonce");
  });

  describe("Plain Vite reveal behavior with and without initMotionReady", () => {
    beforeEach(() => {
      document.documentElement.removeAttribute("data-motion");
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

    it("leaves TextReveal and ScrollReveal in fully visible static fallback without initMotionReady", () => {
      // In a plain Vite app without calling initMotionReady(), data-motion is never set on html
      expect(document.documentElement.getAttribute("data-motion")).toBeNull();

      const { container: trContainer } = render(
        <TextReveal>Verified Headline</TextReveal>
      );
      // Accessible text is rendered in DOM
      expect(trContainer.textContent).toContain("Verified Headline");
      // The CSS gate [data-motion="ok"] .fb-tr-token does NOT match root
      const rootHasMotionOk = document.documentElement.matches('[data-motion="ok"]');
      expect(rootHasMotionOk).toBe(false);

      const { container: srContainer } = render(
        <ScrollReveal>
          <div data-testid="sr-content">Revealed Content</div>
        </ScrollReveal>
      );
      expect(srContainer.textContent).toContain("Revealed Content");
      // Root does not have data-motion, so .fb-sr-hidden has no opacity: 0 selector applied
      expect(document.documentElement.getAttribute("data-motion")).toBeNull();
    });

    it("activates reveal gates when initMotionReady() is called in client entry", () => {
      // In a plain Vite app calling initMotionReady() in main.tsx:
      initMotionReady();
      expect(document.documentElement.getAttribute("data-motion")).toBe("ok");

      const { container: trContainer } = render(
        <TextReveal>Verified Headline</TextReveal>
      );
      expect(trContainer.textContent).toContain("Verified Headline");
      // The CSS selector [data-motion="ok"] is now valid on the document root
      expect(document.documentElement.matches('[data-motion="ok"]')).toBe(true);

      const { container: srContainer } = render(
        <ScrollReveal>
          <div>Revealed Content</div>
        </ScrollReveal>
      );
      expect(srContainer.textContent).toContain("Revealed Content");
      expect(document.documentElement.getAttribute("data-motion")).toBe("ok");
    });

    it("does not set data-motion when prefers-reduced-motion is active", () => {
      window.matchMedia = ((query: string) => ({
        matches: query.includes("prefers-reduced-motion: reduce"),
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => true,
      })) as any;

      initMotionReady();
      expect(document.documentElement.getAttribute("data-motion")).toBeNull();
    });
  });
});
