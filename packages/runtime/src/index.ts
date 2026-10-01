// Original — Frictionborn Motion Runtime Main Entry
export { useReducedMotion } from "./reduced-motion.js";
export { useCapability, type Tier, type PointerType, type Capability } from "./capability.js";
export { useHydrated } from "./hydrated.js";
export { useInView, type InViewOptions } from "./in-view.js";
export { useFrame, subscribeFrame, type FrameCallback, type FrameState, type FrameOptions } from "./frame.js";
export { useFrameGuard, type FrameGuardOptions } from "./frame-guard.js";
export { glBudget, type Lease, type AcquireOptions } from "./gl-budget.js";
export { pauseAll, resumeAll, usePaused, getIsPaused } from "./pause.js";
export { MotionReadyScript, type MotionReadyScriptProps } from "./motion-ready.js";
export { tokens, type MotionTokens } from "./tokens.js";
