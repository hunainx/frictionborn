// Original — Frictionborn Motion Vite + React client smoke test
// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import React from "react";
import { render } from "@testing-library/react";

// Test importing every public API from the package root (default browser/client condition)
import {
  useReducedMotion,
  useCapability,
  useHydrated,
  useInView,
  useFrame,
  useFrameGuard,
  glBudget,
  pauseAll,
  resumeAll,
  usePaused,
  MotionReadyScript,
  tokens,
} from "@frictionborn/runtime";

import { createSurface } from "@frictionborn/runtime/gl";

describe("Plain Vite + React client smoke test", () => {
  it("exports every runtime hook and utility under the default condition", () => {
    expect(typeof useReducedMotion).toBe("function");
    expect(typeof useCapability).toBe("function");
    expect(typeof useHydrated).toBe("function");
    expect(typeof useInView).toBe("function");
    expect(typeof useFrame).toBe("function");
    expect(typeof useFrameGuard).toBe("function");
    expect(typeof pauseAll).toBe("function");
    expect(typeof resumeAll).toBe("function");
    expect(typeof usePaused).toBe("function");
    expect(typeof glBudget.acquire).toBe("function");
    expect(typeof tokens).toBe("object");
    expect(tokens.duration.fast).toBe(150);
    expect(typeof createSurface).toBe("function");
  });

  it("allows MotionReadyScript and hooks to be used in client components simultaneously", () => {
    function ViteApp() {
      const reduced = useReducedMotion();
      const hydrated = useHydrated();
      return (
        <div>
          <MotionReadyScript nonce="vite-nonce" />
          <span data-testid="status">
            {hydrated ? "hydrated" : "unhydrated"}-{reduced ? "reduced" : "normal"}
          </span>
        </div>
      );
    }

    const { getByTestId, container } = render(<ViteApp />);
    expect(getByTestId("status")).toBeDefined();
    const script = container.querySelector("script");
    expect(script).not.toBeNull();
    expect(script?.getAttribute("nonce")).toBe("vite-nonce");
  });
});
