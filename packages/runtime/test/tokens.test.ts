import { describe, it, expect } from "vitest";
import { tokens } from "../src/tokens.js";

describe("Motion Tokens", () => {
  it("matches DESIGN.md A2 values exactly", () => {
    expect(tokens.duration.fast).toBe(150);
    expect(tokens.duration.base).toBe(400);
    expect(tokens.duration.slow).toBe(900);

    expect(tokens.ease.outCss).toBe("cubic-bezier(0.22, 1, 0.36, 1)");
    expect(tokens.ease.inOutCss).toBe("cubic-bezier(0.65, 0, 0.35, 1)");

    expect(tokens.stagger.desktop).toBe(60);
    expect(tokens.stagger.mobile).toBe(40);
    expect(tokens.stagger.maxMobile).toBe(600);

    expect(tokens.distance.desktop).toBe(24);
    expect(tokens.distance.mobile).toBe(12);
  });
});
