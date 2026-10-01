// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useFrameGuard } from "../src/frame-guard.js";

describe("useFrameGuard", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not downgrade if frames are within budget", () => {
    const onDowngrade = vi.fn();
    renderHook(() => useFrameGuard({ onDowngrade }));

    // Advance 3 seconds of normal 16ms frames
    for (let i = 0; i < 60; i++) {
      vi.advanceTimersByTime(16);
    }

    expect(onDowngrade).not.toHaveBeenCalled();
  });
});
