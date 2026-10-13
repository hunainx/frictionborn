// Original — Frictionborn Motion harness page for the universal `paused` prop (docs/API-CONVENTIONS.md §1).
// /paused-cases?item=<name>&paused=1 renders ONE item with `paused` set, plus a button that flips it, so a spec can
// count requestAnimationFrame callbacks while paused, after resuming, and after pausing again.
"use client";

import React, { useState, useEffect, use } from "react";
import { TextReveal } from "../../../../registry/items/text-reveal/text-reveal";
import { ScrollReveal } from "../../../../registry/items/scroll-reveal/scroll-reveal";
import { MagneticButton } from "../../../../registry/items/magnetic-button/magnetic-button";
import { Marquee } from "../../../../registry/items/marquee/marquee";
import { SmoothScroll } from "../../../../registry/items/smooth-scroll/smooth-scroll";
import { StickyScrollStory } from "../../../../registry/items/sticky-scroll-story/sticky-scroll-story";
import { NoiseField } from "../../../../registry/items/noise-field/noise-field";
import { ParticleField } from "../../../../registry/items/particle-field/particle-field";
import { MeshGradient } from "../../../../registry/items/mesh-gradient/mesh-gradient";
import { DistortionImage } from "../../../../registry/items/distortion-image/distortion-image";
import { AmbientHero } from "../../../../registry/items/ambient-hero/ambient-hero";
import { ScrollShowcase } from "../../../../registry/items/scroll-showcase/scroll-showcase";
import { LanternSky } from "../../../../registry/items/lantern-sky/lantern-sky";
import { AshText } from "../../../../registry/items/ash-text/ash-text";
import { FireworkRating } from "../../../../registry/items/firework-rating/firework-rating";
import { EclipseSwitch } from "../../../../registry/items/eclipse-switch/eclipse-switch";
import { HoldToConfirm } from "../../../../registry/items/hold-to-confirm/hold-to-confirm";
import { FlintButton } from "../../../../registry/items/flint-button/flint-button";
import { FuseToast } from "../../../../registry/items/fuse-toast/fuse-toast";
import { MatchProgress } from "../../../../registry/items/match-progress/match-progress";
import { TemperSlider } from "../../../../registry/items/temper-slider/temper-slider";
import { LightLeakTabs } from "../../../../registry/items/light-leak-tabs/light-leak-tabs";
import { EmberBadge } from "../../../../registry/items/ember-badge/ember-badge";
import { FlameSwitch } from "../../../../registry/items/flame-switch/flame-switch";

const STEPS = [
  { id: "a", title: "First step", description: "The first thing that happens.", media: { content: <div>One</div> } },
  { id: "b", title: "Second step", description: "The second thing that happens.", media: { content: <div>Two</div> } },
];

const FILL: React.CSSProperties = { width: "100%", height: "420px", position: "relative" };

function renderItem(item: string, paused: boolean) {
  switch (item) {
    case "text-reveal":
      return <TextReveal as="h1" paused={paused} replayKey={paused ? "p" : "r"}>A headline that arrives word by word</TextReveal>;
    case "scroll-reveal":
      return (
        <ScrollReveal paused={paused}>
          <p>Revealed block</p>
        </ScrollReveal>
      );
    case "magnetic-button":
      return (
        <MagneticButton paused={paused} pullDistance={30} data-testid="subject">
          <button type="button" style={{ width: 200, height: 60 }}>Pull me</button>
        </MagneticButton>
      );
    case "marquee":
      return (
        <Marquee paused={paused} data-testid="subject">
          <span>Alpha</span>
          <span>Beta</span>
          <span>Gamma</span>
        </Marquee>
      );
    case "smooth-scroll":
      return (
        <SmoothScroll paused={paused}>
          <div style={{ height: "4000px" }}>Tall page</div>
        </SmoothScroll>
      );
    case "sticky-scroll-story":
      return <StickyScrollStory steps={STEPS} paused={paused} />;
    case "noise-field":
      return <NoiseField paused={paused} style={FILL} />;
    case "particle-field":
      return <ParticleField paused={paused} style={FILL} />;
    case "mesh-gradient":
      return <MeshGradient paused={paused} style={FILL} />;
    case "distortion-image":
      return (
        <DistortionImage paused={paused} src="/assets/distortion/art-1.webp" alt="A painting" width={600} height={400} data-testid="subject" />
      );
    case "ambient-hero":
      return (
        <AmbientHero
          paused={paused}
          headline="A headline for the hero"
          body="One plain sentence of body copy."
          primaryCta={{ label: "Do the thing", href: "#" }}
        />
      );
    case "scroll-showcase":
      return <ScrollShowcase paused={paused} headline="A headline" description="Some copy." steps={STEPS} marqueeItems={["One", "Two"]} />;
    case "flame-switch":
      return <FlameSwitch paused={paused} label="Pilot flame" defaultChecked data-testid="subject" />;
    case "ember-badge":
      return <EmberBadge paused={paused} count={3} data-testid="subject"><button type="button">Inbox</button></EmberBadge>;
    case "light-leak-tabs":
      return <LightLeakTabs paused={paused} label="Tabs" tabs={[{ id: "a", label: "One", content: <p>One</p> }, { id: "b", label: "Two", content: <p>Two</p> }]} data-testid="subject" />;
    case "temper-slider":
      return <TemperSlider paused={paused} data-testid="subject" />;
    case "match-progress":
      return <MatchProgress paused={paused} value={60} label="Progress" data-testid="subject" />;
    case "fuse-toast":
      return <FuseToast paused={paused} open message="Saved." data-testid="subject" />;
    case "flint-button":
      return <FlintButton paused={paused} data-testid="subject">Strike</FlintButton>;
    case "hold-to-confirm":
      return <HoldToConfirm paused={paused} data-testid="subject">Hold to delete</HoldToConfirm>;
    case "eclipse-switch":
      return <EclipseSwitch paused={paused} data-testid="subject" />;
    case "firework-rating":
      return <FireworkRating paused={paused} data-testid="subject" />;
    case "ash-text":
      return <AshText paused={paused} data-testid="subject">Ephemeral</AshText>;
    case "lantern-sky":
      return <LanternSky paused={paused} data-testid="subject"><p>Sky</p></LanternSky>;
    default:
      return <p>Unknown item {item}</p>;
  }
}

export default function PausedCasesPage({ searchParams }: { searchParams: Promise<{ item?: string; paused?: string; tier?: string }> }) {
  const q = use(searchParams);
  const item = q.item ?? "";
  const [paused, setPaused] = useState(q.paused === "1");
  useEffect(() => {
    if (q.tier === undefined) return;
    document.documentElement.setAttribute("data-fb-tier", q.tier);
    return () => document.documentElement.removeAttribute("data-fb-tier");
  }, [q.tier]);
  return (
    <div style={{ padding: "1rem", minHeight: "100vh", background: "var(--background, #080A0E)", color: "var(--foreground, #F1F5F9)" }}>
      <button type="button" data-testid="toggle-paused" aria-pressed={paused} onClick={() => setPaused((p) => !p)} style={{ minHeight: 44 }}>
        {paused ? "Resume" : "Pause"}
      </button>
      <div data-testid="paused-state">{paused ? "paused" : "running"}</div>
      <div data-testid="case-root">{renderItem(item, paused)}</div>
    </div>
  );
}
