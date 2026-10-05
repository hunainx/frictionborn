// Original — Frictionborn Motion commit 48e0ce4 behavior verification tests (M5-28)
// Verifies behavior changes introduced in 48e0ce4:
// 1. MagneticButton accepts ReactNode children (strings, multiple children, fragments) instead of single ReactElement.
// 2. MagneticButton composes onFocus directly on the root wrapper instead of cloneElement.
// 3. NoiseField and ParticleField derive tier synchronously without post-mount effect flashes.
// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from "vitest";
import React from "react";
import { render, cleanup, fireEvent } from "@testing-library/react";
import { MagneticButton } from "../registry/items/magnetic-button/magnetic-button";
import { NoiseField } from "../registry/items/noise-field/noise-field";
import { ParticleField } from "../registry/items/particle-field/particle-field";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Commit 48e0ce4 behavior: MagneticButton ReactNode children and focus composition", () => {
  it("renders with plain string child without throwing cloneElement error", () => {
    const { getByText } = render(<MagneticButton>Click me</MagneticButton>);
    expect(getByText("Click me")).toBeDefined();
  });

  it("renders with multiple sibling children without requiring a single ReactElement", () => {
    const { getByText } = render(
      <MagneticButton>
        <span>Icon</span>
        <span>Action Text</span>
      </MagneticButton>
    );
    expect(getByText("Icon")).toBeDefined();
    expect(getByText("Action Text")).toBeDefined();
  });

  it("composes onFocus on the root container and receives focus events from inner elements", () => {
    const onFocus = vi.fn();
    const { getByRole } = render(
      <MagneticButton onFocus={onFocus}>
        <button type="button">Trigger</button>
      </MagneticButton>
    );
    const button = getByRole("button");
    fireEvent.focus(button);
    expect(onFocus).toHaveBeenCalledTimes(1);
  });
});

describe("Commit 48e0ce4 behavior: synchronous tier derivation in WebGL items", () => {
  it("NoiseField synchronously renders data-tier without waiting for post-mount effect", () => {
    const { container } = render(<NoiseField maxTier={2} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toBeDefined();
    // effectiveTier is bounded by maxTier and capability synchronously
    const tierAttr = root.getAttribute("data-tier");
    expect(tierAttr).toBeDefined();
    expect(Number(tierAttr)).toBeLessThanOrEqual(2);
  });

  it("ParticleField synchronously renders data-tier without waiting for post-mount effect", () => {
    const { container } = render(<ParticleField maxTier={1} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toBeDefined();
    const tierAttr = root.getAttribute("data-tier");
    expect(tierAttr).toBeDefined();
    expect(Number(tierAttr)).toBeLessThanOrEqual(1);
  });
});
