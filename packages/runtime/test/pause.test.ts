import { describe, it, expect, beforeEach } from "vitest";
import { pauseAll, resumeAll, getIsPaused } from "../src/pause.js";

describe("Pause API", () => {
  beforeEach(() => {
    resumeAll();
  });

  it("toggles global pause state", () => {
    expect(getIsPaused()).toBe(false);
    pauseAll();
    expect(getIsPaused()).toBe(true);
    resumeAll();
    expect(getIsPaused()).toBe(false);
  });
});
