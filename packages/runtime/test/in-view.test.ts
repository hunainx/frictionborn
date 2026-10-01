// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useInView } from "../src/in-view.js";

describe("useInView", () => {
  let observedElements: Element[] = [];

  beforeEach(() => {
    observedElements = [];
    (window as any).IntersectionObserver = vi.fn().mockImplementation((callback: any) => ({
      observe: vi.fn((elem: Element) => {
        observedElements.push(elem);
      }),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));
  });

  it("observes the target element", () => {
    const el = document.createElement("div");
    const ref = { current: el };

    const { result } = renderHook(() => useInView(ref));

    expect(result.current).toBe(false);
    expect(observedElements).toContain(el);
  });
});
