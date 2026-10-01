// Original — Frictionborn Motion
// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import React from "react";
import { MotionReadyScript, initMotionReady } from "../src/motion-ready.js";

describe("MotionReadyScript", () => {
  it("renders script element without nonce by default", () => {
    const { container } = render(<MotionReadyScript />);
    const script = container.querySelector("script#frictionborn-motion-ready");
    expect(script).not.toBeNull();
    expect(script?.getAttribute("nonce")).toBeNull();
    expect(script?.innerHTML).toContain("data-motion");
  });

  it("renders script element with provided nonce for CSP", () => {
    const { container } = render(<MotionReadyScript nonce="test-csp-nonce-123" />);
    const script = container.querySelector("script#frictionborn-motion-ready");
    expect(script).not.toBeNull();
    expect(script?.getAttribute("nonce")).toBe("test-csp-nonce-123");
  });

  it("initMotionReady sets data-motion='ok' when reduced motion is not active", () => {
    document.documentElement.removeAttribute("data-motion");
    window.matchMedia = (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true,
    } as any);

    initMotionReady();
    expect(document.documentElement.getAttribute("data-motion")).toBe("ok");
  });

  it("initMotionReady does not set data-motion='ok' when reduced motion is preferred", () => {
    document.documentElement.removeAttribute("data-motion");
    window.matchMedia = (query: string) => ({
      matches: query.includes("prefers-reduced-motion: reduce"),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true,
    } as any);

    initMotionReady();
    expect(document.documentElement.getAttribute("data-motion")).toBeNull();
  });
});
