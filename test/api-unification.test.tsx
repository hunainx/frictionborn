// Original — Frictionborn Motion API Unification unit tests
// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import React, { createRef } from "react";
import { render } from "@testing-library/react";
import { MagneticButton } from "../registry/items/magnetic-button/magnetic-button";
import { Marquee } from "../registry/items/marquee/marquee";
import { TextReveal } from "../registry/items/text-reveal/text-reveal";
import { ScrollReveal } from "../registry/items/scroll-reveal/scroll-reveal";
import { StickyScrollStory } from "../registry/items/sticky-scroll-story/sticky-scroll-story";

describe("API Unification", () => {
  it("MagneticButton forwards ref, accepts pullDistance and paused, and spreads rest props", () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(
      <MagneticButton ref={ref} pullDistance={24} paused={true} data-testid="mag-btn" className="custom-btn">
        <button type="button">Click me</button>
      </MagneticButton>
    );

    const el = container.querySelector('[data-testid="mag-btn"]');
    expect(el).not.toBeNull();
    expect(ref.current).toBe(el);
    expect(el?.classList.contains("custom-btn")).toBe(true);
  });

  it("Marquee accepts pixelsPerSecond and speed multiplier, forwards ref, and spreads rest props", () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(
      <Marquee ref={ref} pixelsPerSecond={60} speed={1.5} paused={true} data-testid="marquee-elem">
        <span>Test 1</span>
        <span>Test 2</span>
      </Marquee>
    );

    const el = container.querySelector('[data-testid="marquee-elem"]');
    expect(el).not.toBeNull();
    expect(ref.current).toBe(el);
  });

  it("TextReveal forwards ref, accepts nonce and paused, and spreads rest props", () => {
    const ref = createRef<HTMLHeadingElement>();
    const { container } = render(
      <TextReveal ref={ref} as="h2" nonce="test-nonce-123" paused={true} data-testid="tr-heading">
        Headline text
      </TextReveal>
    );

    const el = container.querySelector('[data-testid="tr-heading"]');
    expect(el).not.toBeNull();
    expect(ref.current).toBe(el);
    const styleTag = container.querySelector("style");
    expect(styleTag?.getAttribute("nonce")).toBe("test-nonce-123");
  });

  it("ScrollReveal forwards ref, accepts nonce and paused, and spreads rest props", () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(
      <ScrollReveal ref={ref} nonce="test-nonce-456" paused={true} data-testid="sr-div">
        <div>Revealed block</div>
      </ScrollReveal>
    );

    const el = container.querySelector('[data-testid="sr-div"]');
    expect(el).not.toBeNull();
    expect(ref.current).toBe(el);
    const styleTag = container.querySelector("style");
    expect(styleTag?.getAttribute("nonce")).toBe("test-nonce-456");
  });

  it("StickyScrollStory forwards ref, accepts nonce and paused, and spreads rest props", () => {
    const ref = createRef<HTMLDivElement>();
    const steps = [
      { id: "1", title: "Step 1", description: "Desc 1", media: { content: <div>Media 1</div> } },
    ];
    const { container } = render(
      <StickyScrollStory ref={ref} steps={steps} nonce="test-nonce-789" paused={true} data-testid="sss-root" />
    );

    const el = container.querySelector('[data-testid="sss-root"]');
    expect(el).not.toBeNull();
    expect(ref.current).toBe(el);
    const styleTag = container.querySelector("style");
    expect(styleTag?.getAttribute("nonce")).toBe("test-nonce-789");
  });
});
