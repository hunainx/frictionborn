// Original — Frictionborn Motion
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useCapability, _resetCapabilityCacheForTesting } from "../src/capability.js";

describe("useCapability", () => {
  beforeEach(() => {
    _resetCapabilityCacheForTesting();
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

  it("assigns tier 2 with maxDpr 1.5 for capable coarse pointers (D-B)", () => {
    window.matchMedia = (query: string) => ({
      matches: query.includes("pointer: coarse"),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true,
    } as any);

    Object.defineProperty(navigator, "deviceMemory", { value: 8, configurable: true });
    Object.defineProperty(navigator, "hardwareConcurrency", { value: 8, configurable: true });

    // Mock WebGL2
    (window as any).WebGL2RenderingContext = function () {};
    HTMLCanvasElement.prototype.getContext = ((type: string) => {
      if (type === "webgl2") {
        return {
          getExtension: () => ({ loseContext: () => {} }),
        };
      }
      return null;
    }) as any;

    const { result } = renderHook(() => useCapability());
    expect(result.current.tier).toBe(2);
    expect(result.current.pointer).toBe("coarse");
    expect(result.current.maxDpr).toBe(1.5);
  });

  it("assigns tier 1 with maxDpr 1 for coarse pointer with low-end hardware", () => {
    window.matchMedia = (query: string) => ({
      matches: query.includes("pointer: coarse"),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true,
    } as any);

    Object.defineProperty(navigator, "deviceMemory", { value: 2, configurable: true });
    Object.defineProperty(navigator, "hardwareConcurrency", { value: 2, configurable: true });

    (window as any).WebGL2RenderingContext = function () {};
    HTMLCanvasElement.prototype.getContext = ((type: string) => {
      if (type === "webgl2") {
        return {
          getExtension: () => ({ loseContext: () => {} }),
        };
      }
      return null;
    }) as any;

    const { result } = renderHook(() => useCapability());
    expect(result.current.tier).toBe(1);
    expect(result.current.maxDpr).toBe(1);
    expect(result.current.reasons).toContain("low-end-hardware");
  });

  // round 4 (Part 6): no throwaway context any more; the first context that cannot be made is reported by createSurface
  it("reads WebGL2 from the API and makes no WebGL context of its own", () => {
    let contextCreationCount = 0;
    (window as unknown as { WebGL2RenderingContext?: unknown }).WebGL2RenderingContext = function () {};
    HTMLCanvasElement.prototype.getContext = ((type: string) => {
      if (/webgl/.test(type)) contextCreationCount++;
      return null;
    }) as unknown as typeof HTMLCanvasElement.prototype.getContext;

    const { result: r1 } = renderHook(() => useCapability());
    expect(r1.current.webgl2).toBe(true);
    const { result: r2 } = renderHook(() => useCapability());
    expect(r2.current.webgl2).toBe(true);
    expect(contextCreationCount).toBe(0);
  });

  it("a WebGL2 context that could not be made drops every item to tier 0", () => {
    window.matchMedia = (query: string) => ({
      matches: query.includes("pointer: coarse"),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true,
    }) as unknown as MediaQueryList;
    Object.defineProperty(navigator, "deviceMemory", { value: 8, configurable: true });
    Object.defineProperty(navigator, "hardwareConcurrency", { value: 8, configurable: true });
    (window as unknown as { WebGL2RenderingContext?: unknown }).WebGL2RenderingContext = function () {};

    const { result } = renderHook(() => useCapability());
    expect(result.current.tier).toBe(2);
    act(() => { window.dispatchEvent(new Event("fb-webgl2-unavailable")); });
    expect(result.current.webgl2).toBe(false);
    expect(result.current.tier).toBe(0);
    expect(result.current.reasons).toContain("no-webgl2");
  });

  it("no WebGL2 API means no WebGL2", () => {
    delete (window as unknown as { WebGL2RenderingContext?: unknown }).WebGL2RenderingContext;
    const { result } = renderHook(() => useCapability());
    expect(result.current.webgl2).toBe(false);
    expect(result.current.tier).toBe(0);
  });
});

