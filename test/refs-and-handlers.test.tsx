// Original — audit M4: docs/API-CONVENTIONS.md §2. Every item's `ref` is a real DOM element (the one the docs name),
// rest props reach it, and a consumer handler is composed with the item's own, not replaced.
// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from "vitest";
import React, { createRef } from "react";
import { render, cleanup, fireEvent } from "@testing-library/react";
import { TextReveal } from "../registry/items/text-reveal/text-reveal";
import { ScrollReveal } from "../registry/items/scroll-reveal/scroll-reveal";
import { MagneticButton } from "../registry/items/magnetic-button/magnetic-button";
import { Marquee } from "../registry/items/marquee/marquee";
import { SmoothScroll } from "../registry/items/smooth-scroll/smooth-scroll";
import { StickyScrollStory } from "../registry/items/sticky-scroll-story/sticky-scroll-story";
import { NoiseField } from "../registry/items/noise-field/noise-field";
import { ParticleField } from "../registry/items/particle-field/particle-field";
import { MeshGradient } from "../registry/items/mesh-gradient/mesh-gradient";
import { DistortionImage } from "../registry/items/distortion-image/distortion-image";
import { AmbientHero } from "../registry/items/ambient-hero/ambient-hero";
import { ScrollShowcase } from "../registry/items/scroll-showcase/scroll-showcase";
import { EmberCore } from "../registry/items/ember-core/ember-core";

afterEach(() => {
  cleanup();
});

const steps = [{ id: "a", title: "Step", description: "Text", media: { content: <div>m</div> } }];

// item name -> [element type the ref must hold, factory(ref)]
const cases: Record<string, [string, (ref: React.Ref<any>) => React.ReactElement]> = {
  "text-reveal": ["h1", (ref) => <TextReveal ref={ref} as="h1" data-x="1">Hello</TextReveal>],
  "scroll-reveal": ["div", (ref) => <ScrollReveal ref={ref} data-x="1"><p>x</p></ScrollReveal>],
  "magnetic-button": ["div", (ref) => <MagneticButton ref={ref} data-x="1"><button type="button">b</button></MagneticButton>],
  marquee: ["div", (ref) => <Marquee ref={ref} data-x="1"><span>a</span></Marquee>],
  "smooth-scroll": ["div", (ref) => <SmoothScroll ref={ref} data-x="1"><p>x</p></SmoothScroll>],
  "sticky-scroll-story": ["div", (ref) => <StickyScrollStory ref={ref} steps={steps} data-x="1" />],
  "noise-field": ["div", (ref) => <NoiseField ref={ref} data-x="1" />],
  "particle-field": ["div", (ref) => <ParticleField ref={ref} data-x="1" />],
  "mesh-gradient": ["div", (ref) => <MeshGradient ref={ref} data-x="1" />],
  "ember-core": ["div", (ref) => <EmberCore ref={ref} data-x="1" />],
  "distortion-image": ["div", (ref) => <DistortionImage ref={ref} src="/a.webp" alt="a" width={10} height={10} data-x="1" />],
  "ambient-hero": ["header", (ref) => <AmbientHero ref={ref} headline="h" body="b" primaryCta={{ label: "go" }} data-x="1" />],
  "scroll-showcase": ["div", (ref) => <ScrollShowcase ref={ref} headline="h" description="d" steps={steps} data-x="1" />],
};

describe("every item: ref is the root DOM element, rest props reach it", () => {
  for (const [item, [tag, make]] of Object.entries(cases)) {
    it(item, () => {
      const ref = createRef<HTMLElement>();
      const { container } = render(make(ref));
      const root = container.querySelector(`[data-frictionborn-item="${item}"]`);
      expect(root, "root element carries data-frictionborn-item").not.toBeNull();
      expect(ref.current, "ref is set").toBe(root);
      expect(ref.current instanceof HTMLElement).toBe(true);
      expect(ref.current!.tagName.toLowerCase()).toBe(tag);
      expect(ref.current!.getAttribute("data-x"), "rest props are spread on the root").toBe("1");
    });
  }

  it("SmoothScroll's ref is display: contents (so it has no box): documented, not a surprise", () => {
    const ref = createRef<HTMLDivElement>();
    render(<SmoothScroll ref={ref}><p>x</p></SmoothScroll>);
    expect(ref.current!.style.display).toBe("contents");
  });
});

describe("MagneticButton composes consumer handlers with its own", () => {
  it("calls onPointerMove and onPointerLeave", () => {
    const move = vi.fn();
    const leave = vi.fn();
    const { container } = render(
      <MagneticButton onPointerMove={move} onPointerLeave={leave}>
        <button type="button">b</button>
      </MagneticButton>
    );
    const root = container.querySelector('[data-frictionborn-item="magnetic-button"]')!;
    fireEvent.pointerMove(root);
    fireEvent.pointerLeave(root);
    expect(move).toHaveBeenCalledTimes(1);
    expect(leave).toHaveBeenCalledTimes(1);
  });

  it("calls the child's own onFocus as well as resetting the pull", () => {
    const focus = vi.fn();
    const { getByRole } = render(
      <MagneticButton>
        <button type="button" onFocus={focus}>b</button>
      </MagneticButton>
    );
    fireEvent.focus(getByRole("button"));
    expect(focus).toHaveBeenCalledTimes(1);
  });
});
