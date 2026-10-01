// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useReducedMotion } from "../src/reduced-motion.js";

describe("useReducedMotion", () => {
  it("reflects prefers-reduced-motion media query", () => {
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

    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });
});
