// Original — Frictionborn Motion SmoothScroll unit tests
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, cleanup } from "@testing-library/react";
import {
  SmoothScroll,
  _resetSmoothScrollSingletonForTesting,
} from "../registry/items/smooth-scroll/smooth-scroll";

// Mock Lenis constructor
let lenisInstances: any[] = [];
let lastLenisOptions: any = null;

vi.mock("lenis", () => {
  return {
    default: class MockLenis {
      options: any;
      onCallback: any = null;
      destroyed = false;
      constructor(options: any) {
        this.options = options;
        lastLenisOptions = options;
        lenisInstances.push(this);
      }
      on(_event: string, cb: any) {
        this.onCallback = cb;
      }
      raf(_time: number) {}
      destroy() {
        this.destroyed = true;
      }
    },
  };
});

describe("SmoothScroll", () => {
  beforeEach(() => {
    _resetSmoothScrollSingletonForTesting();
    lenisInstances = [];
    lastLenisOptions = null;
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

  afterEach(() => {
    cleanup(); // unmount: the shared frame loop now really runs and must not outlive the test
    vi.restoreAllMocks();
  });

  it("instantiates Lenis with autoRaf: false on desktop fine pointer", () => {
    const { container } = render(
      <SmoothScroll>
        <div>Content</div>
      </SmoothScroll>
    );

    const active = lenisInstances.filter((i) => !i.destroyed);
    expect(active.length).toBe(1);
    expect(lastLenisOptions?.autoRaf).toBe(false);
    expect(container.textContent).toContain("Content");
  });

  it("warns and no-ops when a duplicate SmoothScroll instance is mounted", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    render(
      <div>
        <SmoothScroll>
          <div>First Instance</div>
        </SmoothScroll>
        <SmoothScroll>
          <div>Second Instance</div>
        </SmoothScroll>
      </div>
    );

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("A SmoothScroll instance is already active. Duplicate instance ignored.")
    );
    // Only one active Lenis instance should exist
    const active = lenisInstances.filter((i) => !i.destroyed);
    expect(active.length).toBe(1);
  });

  it("disables Lenis when reduced motion is preferred", () => {
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

    render(
      <SmoothScroll>
        <div>Reduced Motion Content</div>
      </SmoothScroll>
    );

    const active = lenisInstances.filter((i) => !i.destroyed);
    expect(active.length).toBe(0);
  });

  it("destroys Lenis and releases singleton lock on unmount", () => {
    const { unmount } = render(
      <SmoothScroll>
        <div>Mount/Unmount Content</div>
      </SmoothScroll>
    );
    const activeInitial = lenisInstances.filter((i) => !i.destroyed);
    expect(activeInitial.length).toBe(1);
    const instance = activeInitial[0];

    unmount();
    expect(instance.destroyed).toBe(true);
    expect(lenisInstances.filter((i) => !i.destroyed).length).toBe(0);

    // After unmount, a new instance can be created without warning
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <SmoothScroll>
        <div>Subsequent Instance</div>
      </SmoothScroll>
    );
    const activeAfter = lenisInstances.filter((i) => !i.destroyed);
    expect(activeAfter.length).toBe(1);
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
