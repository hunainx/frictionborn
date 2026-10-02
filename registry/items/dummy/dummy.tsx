// Original — Frictionborn Motion
"use client";

import React from "react";
import { useReducedMotion, useInView, useCapability } from "@frictionborn/runtime";

export interface DummyProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export function Dummy({ children, className = "", ...props }: DummyProps) {
  const reduced = useReducedMotion();
  const capability = useCapability();
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref);

  return (
    <div
      ref={ref}
      data-frictionborn-item="dummy"
      data-tier={capability.tier}
      data-in-view={inView}
      data-reduced-motion={reduced}
      className={`relative overflow-hidden transition-opacity duration-300 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
