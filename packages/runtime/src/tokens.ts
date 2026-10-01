// Original — Frictionborn Motion tokens (DESIGN.md A2)

export interface MotionTokens {
  duration: {
    fast: number;
    base: number;
    slow: number;
  };
  ease: {
    out: readonly [number, number, number, number];
    outCss: string;
    inOut: readonly [number, number, number, number];
    inOutCss: string;
  };
  stagger: {
    desktop: number;
    mobile: number;
    maxMobile: number;
  };
  distance: {
    desktop: number;
    mobile: number;
  };
}

export const tokens: MotionTokens = {
  duration: {
    fast: 150,
    base: 400,
    slow: 900,
  },
  ease: {
    out: [0.22, 1, 0.36, 1] as const,
    outCss: "cubic-bezier(0.22, 1, 0.36, 1)",
    inOut: [0.65, 0, 0.35, 1] as const,
    inOutCss: "cubic-bezier(0.65, 0, 0.35, 1)",
  },
  stagger: {
    desktop: 60,
    mobile: 40,
    maxMobile: 600,
  },
  distance: {
    desktop: 24,
    mobile: 12,
  },
} as const;
