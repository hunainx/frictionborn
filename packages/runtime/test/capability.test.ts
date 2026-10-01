// Original — Frictionborn Motion
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useCapability } from "../src/capability.js";

describe("useCapability", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("data-fb-tier");
    window.matchMedia = (query: string) => ({
      matches: query.includes("pointer: fine") || query.includes("hover: hover"),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true,
    } as any);
  });

  it("respects data-fb-tier override", () => {
    document.documentElement.setAttribute("data-fb-tier", "1");
    const { result } = renderHook(() => useCapability());
    expect(result.current.tier).toBe(1);
    expect(result.current.reasons).toContain("override:1");

    document.documentElement.setAttribute("data-fb-tier", "0");
    const { result: r0 } = renderHook(() => useCapability());
    expect(r0.current.tier).toBe(0);
    expect(r0.current.reducedMotion).toBe(true);
  });

  it("assigns tier 0 when reduced motion is preferred", () => {
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

    const { result } = renderHook(() => useCapability());
    expect(result.current.tier).toBe(0);
    expect(result.current.reducedMotion).toBe(true);
    expect(result.current.reasons).toContain("reduced-motion");
  });
});
