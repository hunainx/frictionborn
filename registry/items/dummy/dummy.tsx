// Original — Frictionborn Motion
"use client";

import React from "react";
import { useReducedMotion, useInView } from "@frictionborn/runtime";

export interface DummyProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export function Dummy({ children, className = "", ...props }: DummyProps) {
  const reduced = useReducedMotion();
  const [ref, inView] = useInView<HTMLDivElement>();

  return (
    <div
      ref={ref}
      data-frictionborn-item="dummy"
      data-in-view={inView}
      data-reduced-motion={reduced}
      className={`relative overflow-hidden transition-opacity duration-300 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
