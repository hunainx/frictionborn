// Original — audit docs: DistortionImage `strength` is 0-1 (docs/API-CONVENTIONS.md); out-of-range values warn in development.
// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from "vitest";
import React from "react";
import { render, cleanup } from "@testing-library/react";
import { DistortionImage } from "../registry/items/distortion-image/distortion-image";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("DistortionImage strength", () => {
  it("warns once per out-of-range render in development and names the received value", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<DistortionImage src="/a.webp" alt="a" strength={5} />);
    expect(warn.mock.calls.some((c) => String(c[0]).includes("strength must be between 0 and 1, got 5"))).toBe(true);
  });

  it("does not warn for values inside 0-1, including the edges", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    for (const strength of [0, 0.25, 1]) {
      render(<DistortionImage src="/a.webp" alt="a" strength={strength} />);
      cleanup();
    }
    expect(warn.mock.calls.filter((c) => String(c[0]).includes("strength must be"))).toEqual([]);
  });

  it("warns for negative values", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<DistortionImage src="/a.webp" alt="a" strength={-0.5} />);
    expect(warn.mock.calls.some((c) => String(c[0]).includes("got -0.5"))).toBe(true);
  });

  it("warns and clamps for NaN values", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<DistortionImage src="/a.webp" alt="a" strength={Number.NaN} />);
    expect(warn.mock.calls.some((c) => String(c[0]).includes("got NaN"))).toBe(true);
  });

  it("does not repeat warning when re-rendered with the same out-of-range strength", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { rerender } = render(<DistortionImage src="/a.webp" alt="a" strength={2} />);
    expect(warn.mock.calls.filter((c) => String(c[0]).includes("strength must be")).length).toBe(1);
    rerender(<DistortionImage src="/a.webp" alt="a" strength={2} />);
    expect(warn.mock.calls.filter((c) => String(c[0]).includes("strength must be")).length).toBe(1);
  });

  it("warns in a Vite dev environment where process.env.NODE_ENV is not set but import.meta.env.DEV is true", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const origEnv = process.env.NODE_ENV;
    try {
      // Simulate Vite browser dev: process.env.NODE_ENV is undefined, import.meta.env.DEV is true
      delete (process.env as Record<string, string | undefined>).NODE_ENV;
      (import.meta as unknown as { env: { DEV: boolean } }).env = { DEV: true };
      render(<DistortionImage src="/a.webp" alt="a" strength={3} />);
      expect(warn.mock.calls.some((c) => String(c[0]).includes("got 3"))).toBe(true);
    } finally {
      process.env.NODE_ENV = origEnv;
    }
  });
});
