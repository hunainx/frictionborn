// Original — Frictionborn Motion regression: NoiseField with default props must not re-render forever
// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, act } from "@testing-library/react";
import { NoiseField } from "../registry/items/noise-field/noise-field";

describe("NoiseField default colours", () => {
  it("settles: the colour resolver does not run in an endless loop (audit M3 #1)", async () => {
    const created: string[] = [];
    const orig = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation(((tag: string, ...a: any[]) => {
      created.push(tag);
      return (orig as any)(tag, ...a);
    }) as any);

    vi.useFakeTimers();
    try {
      render(<NoiseField />); // default colours = host tokens
      await act(async () => {
        vi.advanceTimersByTime(400);
      });
      const probes = created.filter((t) => t === "span").length;
      // 3 colours resolved on mount (plus at most a couple of strict-mode/theme re-runs); a loop makes thousands
      expect(probes).toBeLessThan(30);
    } finally {
      vi.useRealTimers();
      vi.restoreAllMocks();
    }
  });
});
