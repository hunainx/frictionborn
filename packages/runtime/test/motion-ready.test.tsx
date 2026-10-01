// Original — Frictionborn Motion
// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import React from "react";
import { MotionReadyScript } from "../src/motion-ready.js";

describe("MotionReadyScript", () => {
  it("renders script element without nonce by default", () => {
    const { container } = render(<MotionReadyScript />);
    const script = container.querySelector("script#frictionborn-motion-ready");
    expect(script).not.toBeNull();
    expect(script?.getAttribute("nonce")).toBeNull();
    expect(script?.innerHTML).toContain("data-motion");
  });

  it("renders script element with provided nonce for CSP", () => {
    const { container } = render(<MotionReadyScript nonce="test-csp-nonce-123" />);
    const script = container.querySelector("script#frictionborn-motion-ready");
    expect(script).not.toBeNull();
    expect(script?.getAttribute("nonce")).toBe("test-csp-nonce-123");
  });
});
