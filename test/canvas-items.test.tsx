// Original — round 4 (DECISIONS 54): the twelve canvas items ported from the lab, checked as a fresh app would use them
// @vitest-environment jsdom
/**
 * For each of the twelve: (1) the server HTML holds the real control or text and no canvas (AGENTS rule 1, DESIGN.md A5); (2) it mounts with
 * default props under real shadcn tokens in light and dark without errors; (3) `ref` is the element carrying data-frictionborn-item and
 * rest props reach it (docs/API-CONVENTIONS.md §2); (4) `palette` sets the five --fb-heat variables for a preset and none for `custom`
 * (DESIGN.md A8).
 */
import { describe, it, expect, afterEach, vi } from "vitest";
import React, { createRef } from "react";
import { renderToString } from "react-dom/server";
import { render, cleanup } from "@testing-library/react";
import { PALETTES } from "@frictionborn/runtime";
import { FlameSwitch } from "../registry/items/flame-switch/flame-switch";
import { EclipseSwitch } from "../registry/items/eclipse-switch/eclipse-switch";
import { TemperSlider } from "../registry/items/temper-slider/temper-slider";
import { LightLeakTabs } from "../registry/items/light-leak-tabs/light-leak-tabs";
import { MatchProgress } from "../registry/items/match-progress/match-progress";
import { FuseToast } from "../registry/items/fuse-toast/fuse-toast";
import { EmberBadge } from "../registry/items/ember-badge/ember-badge";
import { FlintButton } from "../registry/items/flint-button/flint-button";
import { HoldToConfirm } from "../registry/items/hold-to-confirm/hold-to-confirm";
import { FireworkRating } from "../registry/items/firework-rating/firework-rating";
import { AshText } from "../registry/items/ash-text/ash-text";
import { LanternSky } from "../registry/items/lantern-sky/lantern-sky";

afterEach(() => cleanup());

type Make = (extra: Record<string, unknown>) => React.ReactElement;
/** name -> [tag of the root, element factory with default props plus `extra`, text or role the server HTML must hold] */
const ITEMS: Record<string, [string, Make, RegExp]> = {
  "flame-switch": ["div", (x) => <FlameSwitch label="Pilot flame" {...x} />, /role="switch"[^>]*aria-checked="false"/],
  "eclipse-switch": ["div", (x) => <EclipseSwitch {...x} />, /role="switch"/],
  "temper-slider": ["div", (x) => <TemperSlider {...x} />, /type="range"/],
  "light-leak-tabs": ["div", (x) => <LightLeakTabs label="Tabs" tabs={[{ id: "a", label: "One", content: <p>First</p> }, { id: "b", label: "Two", content: <p>Second</p> }]} {...x} />, /role="tablist"[\s\S]*First/],
  "match-progress": ["div", (x) => <MatchProgress value={40} label="Progress" {...x} />, /role="progressbar"[^>]*aria-valuenow="40"/],
  "fuse-toast": ["div", (x) => <FuseToast open message="Saved." {...x} />, /role="status"[\s\S]*Saved\./],
  "ember-badge": ["div", (x) => <EmberBadge count={3} {...x}><button type="button">Inbox</button></EmberBadge>, /3 unread/],
  "flint-button": ["button", (x) => <FlintButton {...x}>Strike</FlintButton>, /<button[^>]*>[\s\S]*Strike/],
  "hold-to-confirm": ["div", (x) => <HoldToConfirm {...x}>Hold to delete</HoldToConfirm>, /<button[^>]*>[\s\S]*Hold to delete/],
  "firework-rating": ["div", (x) => <FireworkRating {...x} />, /role="radiogroup"/],
  "ash-text": ["div", (x) => <AshText {...x}>Ephemeral</AshText>, /<h2[^>]*>Ephemeral<\/h2>/],
  "lantern-sky": ["div", (x) => <LanternSky {...x}><p>Let it rise.</p></LanternSky>, /Let it rise\./],
};

const TOKENS = {
  light: { "--background": "oklch(1 0 0)", "--foreground": "oklch(0.145 0 0)", "--primary": "oklch(0.205 0 0)", "--muted-foreground": "oklch(0.556 0 0)", "--ring": "oklch(0.708 0 0)" },
  dark: { "--background": "oklch(0.145 0 0)", "--foreground": "oklch(0.985 0 0)", "--primary": "oklch(0.922 0 0)", "--muted-foreground": "oklch(0.708 0 0)", "--ring": "oklch(0.556 0 0)" },
};

describe("the twelve canvas items", () => {
  for (const [name, [tag, make, server]] of Object.entries(ITEMS)) {
    describe(name, () => {
      it("server HTML: the real control or text, the item marker, no canvas", () => {
        const html = renderToString(make({}));
        expect(html).toMatch(new RegExp(`data-frictionborn-item="${name}"`));
        expect(html).toMatch(server);
        expect(html).not.toMatch(/<canvas/);
      });

      for (const theme of ["light", "dark"] as const) {
        it(`mounts with default props under shadcn ${theme} tokens without errors`, () => {
          const err = vi.spyOn(console, "error").mockImplementation(() => {});
          const { container } = render(<div style={TOKENS[theme] as React.CSSProperties}>{make({})}</div>);
          expect(container.querySelector(`[data-frictionborn-item="${name}"]`)).not.toBeNull();
          // jsdom has no canvas: it reports getContext as not implemented and returns null, which the items handle (no drawing)
          const real = err.mock.calls.filter((c) => !/Not implemented: HTMLCanvasElement\.prototype\.getContext/.test(String(c[0]?.message ?? c[0])));
          expect(real).toEqual([]);
          err.mockRestore();
        });
      }

      it("ref is the marked root and rest props reach it", () => {
        const ref = createRef<HTMLElement>();
        const { container } = render(make({ ref, "data-x": "1" }));
        const root = container.querySelector(`[data-frictionborn-item="${name}"]`);
        expect(ref.current).toBe(root);
        expect(ref.current!.tagName.toLowerCase()).toBe(tag);
        expect(ref.current!.getAttribute("data-x")).toBe("1");
      });

      it("palette: a preset sets --fb-heat-0..4, custom sets none", () => {
        const { container, rerender } = render(make({ palette: "ice" }));
        // FlintButton keeps the variables on its wrapper (the <button> is its root)
        const host = (r: Element | null) => (name === "flint-button" ? (r?.parentElement as HTMLElement) : (r as HTMLElement));
        let el = host(container.querySelector(`[data-frictionborn-item="${name}"]`));
        PALETTES.ice.forEach((c, i) => expect(el.style.getPropertyValue(`--fb-heat-${i}`).toUpperCase()).toBe(c));
        rerender(make({ palette: "custom" }));
        el = host(container.querySelector(`[data-frictionborn-item="${name}"]`));
        expect(el.style.getPropertyValue("--fb-heat-2")).toBe("");
      });
    });
  }
});
