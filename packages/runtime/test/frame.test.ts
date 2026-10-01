// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { subscribeFrame } from "../src/frame.js";
import { pauseAll, resumeAll } from "../src/pause.js";

describe("useFrame / subscribeFrame", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resumeAll();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("subscribes and executes callback with time and dt", () => {
    let called = false;
    let receivedDt = 0;

    const unsubscribe = subscribeFrame(({ dt }) => {
      called = true;
      receivedDt = dt;
    });

    // Advance frame
    vi.advanceTimersByTime(16);

    expect(called).toBe(true);
    expect(receivedDt).toBeLessThanOrEqual(50);

    unsubscribe();
  });

  it("does not invoke callback when paused", () => {
    let callCount = 0;

    const unsubscribe = subscribeFrame(() => {
      callCount++;
    });

    vi.advanceTimersByTime(16);
    expect(callCount).toBeGreaterThan(0);

    const prevCount = callCount;
    pauseAll();
    vi.advanceTimersByTime(50);
    expect(callCount).toBe(prevCount);

    resumeAll();
    vi.advanceTimersByTime(16);
    expect(callCount).toBeGreaterThan(prevCount);

    unsubscribe();
  });
});
