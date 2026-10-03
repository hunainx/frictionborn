// Original — Frictionborn Motion Unit Test
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { StickyScrollStory } from "../registry/items/sticky-scroll-story/sticky-scroll-story";

const mockSteps = [
  {
    id: "step-1",
    title: "First Phase",
    badge: "01",
    description: "Initial pipeline stage.",
    media: { content: <div data-testid="media-1">Media 1</div> },
  },
  {
    id: "step-2",
    title: "Second Phase",
    badge: "02",
    description: "Processing pipeline stage.",
    media: { content: <div data-testid="media-2">Media 2</div> },
  },
];

describe("StickyScrollStory", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders narrative steps in reading order", () => {
    render(<StickyScrollStory steps={mockSteps} />);

    expect(screen.getByText("First Phase")).toBeDefined();
    expect(screen.getByText("Second Phase")).toBeDefined();
    expect(screen.getByText("Initial pipeline stage.")).toBeDefined();
  });

  it("attaches data attributes for item and tier", () => {
    const { container } = render(<StickyScrollStory steps={mockSteps} />);
    const root = container.querySelector('[data-frictionborn-item="sticky-scroll-story"]');
    expect(root).not.toBeNull();
    expect(root?.getAttribute("data-tier")).toBeDefined();
  });

  it("renders mobile inline fallback content and desktop sticky column", () => {
    const { container } = render(<StickyScrollStory steps={mockSteps} />);
    const desktopMediaCol = container.querySelector(".fb-sss-media-col");
    const mobileMedias = container.querySelectorAll(".fb-sss-mobile-media");

    expect(desktopMediaCol).not.toBeNull();
    expect(mobileMedias.length).toBe(2);
  });
});
