// Original — compile-time contract of the compositions (Decision 29): content props are required in TypeScript.
// Every `@ts-expect-error` below must be a real error: if a prop becomes optional, tsc reports an unused directive and
// test/compositions.test.tsx fails. Compiled by `tsc -p test/types/tsconfig.json`, never executed.
import React from "react";
import { AmbientHero } from "@/components/ui/ambient-hero";
import { ScrollShowcase } from "@/components/ui/scroll-showcase";

const steps = [{ id: "a", title: "A", description: "a", media: { content: <div /> } }];
const cta = { label: "Go", href: "/" };

export const ok = [
  <AmbientHero key="1" headline="h" body="b" primaryCta={cta} />,
  <ScrollShowcase key="2" headline="h" description="d" steps={steps} />,
];

export const missing = [
  // @ts-expect-error headline is required
  <AmbientHero key="1" body="b" primaryCta={cta} />,
  // @ts-expect-error body is required
  <AmbientHero key="2" headline="h" primaryCta={cta} />,
  // @ts-expect-error primaryCta is required
  <AmbientHero key="3" headline="h" body="b" />,
  // @ts-expect-error headline is required
  <ScrollShowcase key="4" description="d" steps={steps} />,
  // @ts-expect-error description is required
  <ScrollShowcase key="5" headline="h" steps={steps} />,
  // @ts-expect-error steps is required
  <ScrollShowcase key="6" headline="h" description="d" />,
];
