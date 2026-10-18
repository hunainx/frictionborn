// Original — Frictionborn Motion EmberCore unit tests
// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import React, { createRef } from "react";
import fs from "node:fs";
import path from "node:path";
import { render, fireEvent, cleanup } from "@testing-library/react";
import { EmberCore } from "../registry/items/ember-core/ember-core";

afterEach(() => cleanup());

describe("EmberCore (#25)", () => {
  it("renders hero mode by default with CSS poster, Strike button, hint copy, ref forwarding, and CSP nonce", () => {
    const ref = createRef<HTMLDivElement>();
    const { container, getByRole } = render(
      <EmberCore ref={ref} nonce="ec-nonce-1" data-testid="ec-hero">
        <h1>We build what others call impossible.</h1>
      </EmberCore>
    );

    const root = container.querySelector('[data-testid="ec-hero"]');
    expect(root).not.toBeNull();
    expect(ref.current).toBe(root);
    expect(root?.getAttribute("data-frictionborn-item")).toBe("ember-core");
    expect(root?.getAttribute("data-interactive")).toBe("hero");

    const poster = container.querySelector('[data-frictionborn-poster="true"]');
    expect(poster).not.toBeNull();

    const styleTag = container.querySelector("style");
    expect(styleTag?.getAttribute("nonce")).toBe("ec-nonce-1");

    const strikeBtn = getByRole("button", { name: "Strike" });
    expect(strikeBtn.tagName).toBe("BUTTON");
    expect(container.textContent).toContain("Move to stir · Click to strike");
    expect(container.textContent).toContain("Tap to strike");
  });

  it("renders full mode with Controls panel, native sliders (Heat, Swirl, Spin, Ash density), palette chips, Sound, Glow and Reset buttons", () => {
    const { container, getByRole, getByLabelText } = render(
      <EmberCore interactive="full" palette="fire" />
    );

    const controlsBtn = getByRole("button", { name: "Controls" });
    expect(controlsBtn.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(controlsBtn);
    expect(controlsBtn.getAttribute("aria-expanded")).toBe("true");

    const heatSlider = getByLabelText("Heat") as HTMLInputElement;
    const swirlSlider = getByLabelText("Swirl") as HTMLInputElement;
    const spinSlider = getByLabelText("Spin") as HTMLInputElement;
    const densitySlider = getByLabelText("Ash density") as HTMLInputElement;

    expect(heatSlider.type).toBe("range");
    expect(swirlSlider.type).toBe("range");
    expect(spinSlider.type).toBe("range");
    expect(densitySlider.type).toBe("range");

    fireEvent.change(heatSlider, { target: { value: "1.5" } });
    expect(heatSlider.value).toBe("1.5");

    const iceChip = getByRole("button", { name: "Ice" });
    fireEvent.click(iceChip);
    expect(iceChip.getAttribute("aria-pressed")).toBe("true");

    const glowBtn = getByRole("button", { name: /Glow/i });
    expect(glowBtn.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(glowBtn);
    expect(glowBtn.getAttribute("aria-pressed")).toBe("false");

    const soundBtn = getByRole("button", { name: /Sound/i });
    expect(soundBtn.getAttribute("aria-pressed")).toBe("false");

    const resetBtn = getByRole("button", { name: "Reset" });
    fireEvent.click(resetBtn);
    expect(heatSlider.value).toBe("1");
    expect(glowBtn.getAttribute("aria-pressed")).toBe("true");
    expect(container.querySelector('[role="status"]')?.textContent).toBe("Reset");
  });

  it("renders none mode without interactive buttons", () => {
    const { container } = render(<EmberCore interactive="none" />);
    expect(container.querySelectorAll("button").length).toBe(0);
  });

  it("includes the Ashima Arts / Stefan Gustavson MIT source header in ember-core.glsl.ts", () => {
    const glslPath = path.resolve(__dirname, "../registry/items/ember-core/ember-core.glsl.ts");
    const glsl = fs.readFileSync(glslPath, "utf8");
    expect(glsl).toMatch(/Source:.*webgl-noise/i);
    expect(glsl).toMatch(/Ashima Arts/i);
    expect(glsl).toMatch(/Stefan Gustavson/i);
    expect(glsl).toMatch(/MIT/);
  });
});
