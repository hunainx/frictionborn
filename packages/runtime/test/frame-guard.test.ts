// Original — Frictionborn Motion
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
    const { unmount } = renderHook(() => useFrameGuard({ onDowngrade }));

    // Advance 3 seconds of normal 16ms frames
    for (let i = 0; i < 60; i++) {
      vi.advanceTimersByTime(16);
    }

    expect(onDowngrade).not.toHaveBeenCalled();
    unmount();
  });

  it("unsubscribes from the shared frame loop once downgraded so zero rAFs fire afterwards (Audit A14)", async () => {
    const { act } = await import("@testing-library/react");
    let rafQueue: FrameRequestCallback[] = [];
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb: FrameRequestCallback) => {
      rafQueue.push(cb);
      return rafQueue.length;
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {
      rafQueue = [];
    });

    const onDowngrade = vi.fn();
    const { unmount } = renderHook(() => useFrameGuard({ onDowngrade, active: true }));

    let now = 1000;
    // Step 60 slow frames (40 ms each -> > 2000 ms window, p75 = 40 > 25)
    act(() => {
      for (let i = 0; i < 60; i++) {
        now += 40;
        const batch = rafQueue;
        rafQueue = [];
        for (const cb of batch) cb(now);
      }
    });

    expect(onDowngrade).toHaveBeenCalledTimes(1);
    // After the downgrade state update commits, the guard must have unsubscribed and cancelled the rAF loop
    expect(rafQueue.length).toBe(0);
    unmount();
  });
});
