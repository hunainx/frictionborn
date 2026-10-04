// Original — Frictionborn Motion
"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense, lazy } from "react";
import {
  useCapability,
  useHydrated,
  useReducedMotion,
  useInView,
  glBudget,
  type Lease,
} from "@frictionborn/runtime";

const DistortionImageGL = lazy(() => import("./distortion-image.gl"));

// A pointer or focus that does nothing for this long eases the ripple out, then gives the context back.
const IDLE_RELEASE_MS = 3000;
const FADE_OUT_MS = 400;

// Focus ring drawn inside the box, above the canvas: an outline outside the box is clipped by any
// overflow:hidden card around the image. Two tones so it stays visible on any picture. The transparent
// outline is what forced-colors / high-contrast modes paint instead of the shadows.
const FOCUS_RING_STYLE: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  zIndex: 4,
  pointerEvents: "none",
  borderRadius: "inherit",
  outline: "2px solid transparent",
  outlineOffset: "-2px",
  boxShadow:
    "inset 0 0 0 3px var(--ring, var(--primary, Highlight)), inset 0 0 0 5px var(--background, Canvas)",
};

export interface DistortionImageProps extends React.HTMLAttributes<HTMLDivElement> {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  strength?: number;
  speed?: number;
  maxTier?: number;
  crossOrigin?: "anonymous" | "use-credentials" | "";
  loading?: "eager" | "lazy";
  decoding?: "async" | "auto" | "sync";
  fetchPriority?: "high" | "low" | "auto";
  fetchpriority?: "high" | "low" | "auto";
  srcSet?: string;
  sizes?: string;
  imgClassName?: string;
  imgStyle?: React.CSSProperties;
  children?: React.ReactNode;
}

export function DistortionImage({
  src,
  alt,
  width,
  height,
  strength = 0.25,
  speed = 1.0,
  maxTier = 3,
  crossOrigin,
  loading = "lazy",
  decoding = "async",
  fetchPriority,
  fetchpriority,
  srcSet,
  sizes,
  imgClassName = "",
  imgStyle,
  className = "",
  style,
  children,
  onPointerEnter,
  onPointerMove,
  onPointerLeave,
  onFocus,
  onBlur,
  ...props
}: DistortionImageProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const instanceId = useRef("distortion-image-" + Math.random().toString(36).slice(2, 8));
  const leaseRef = useRef<Lease | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hydrated = useHydrated(); // @frictionborn-guard
  const cap = useCapability(); // @frictionborn-guard
  const prefersReduced = useReducedMotion(); // @frictionborn-guard
  const inView = useInView(containerRef); // @frictionborn-guard

  const [hasLease, setHasLease] = useState(false);
  const [needsLease, setNeedsLease] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [pointerPos, setPointerPos] = useState({ x: 0.5, y: 0.5 });
  const [imgLoaded, setImgLoaded] = useState(false);
  const [taintedCORS, setTaintedCORS] = useState(false);
  const [glFailed, setGlFailed] = useState(false);
  const [isFinePointer, setIsFinePointer] = useState(false);
  const [focusVisible, setFocusVisible] = useState(false);

  // Detect fine pointer capability and hover support ((hover: hover) and (pointer: fine))
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const media = window.matchMedia("(hover: hover) and (pointer: fine)");
    setIsFinePointer(media.matches);
    const listener = (e: MediaQueryListEvent) => setIsFinePointer(e.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  const effectiveTier = Math.min(cap.tier, maxTier);

  // Compute pointer coordinates normalized [0, 1] relative to the element bounding box
  const updatePointer = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
      setPointerPos({ x, y });
    }
  }, []);

  const clearIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }, []);

  // Any interaction restarts the idle clock. After IDLE_RELEASE_MS of nothing the ripple eases out, the
  // lease is marked evictable straight away, and the context is released once the fade has finished.
  const armIdleTimer = useCallback(() => {
    clearIdleTimer();
    idleTimerRef.current = setTimeout(() => {
      setIsHovered(false);
      leaseRef.current?.setOffScreen(true);
      idleTimerRef.current = setTimeout(() => {
        idleTimerRef.current = null;
        setNeedsLease(false);
      }, FADE_OUT_MS);
    }, IDLE_RELEASE_MS);
  }, [clearIdleTimer]);

  const activate = useCallback(() => {
    setIsHovered(true);
    setNeedsLease(true);
    leaseRef.current?.setOffScreen(false);
    armIdleTimer();
  }, [armIdleTimer]);

  // Pointer left or focus moved away: ease out now, keep the context for a grace period so coming back is
  // instant, but let another image take the slot if it needs one (the budget evicts idle leases, LRU first).
  const deactivate = useCallback(() => {
    setIsHovered(false);
    leaseRef.current?.setOffScreen(true);
    clearIdleTimer();
    idleTimerRef.current = setTimeout(() => {
      idleTimerRef.current = null;
      setNeedsLease(false);
    }, IDLE_RELEASE_MS);
  }, [clearIdleTimer]);

  const handlePointerEnter = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      onPointerEnter?.(e);
      if (e.pointerType === "touch") return; // Touch pointers fall back to plain image (0 contexts)
      updatePointer(e);
      activate();
    },
    [onPointerEnter, updatePointer, activate]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      onPointerMove?.(e);
      if (e.pointerType === "touch") return;
      updatePointer(e);
      activate();
    },
    [onPointerMove, updatePointer, activate]
  );

  const handlePointerLeave = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      onPointerLeave?.(e);
      deactivate();
    },
    [onPointerLeave, deactivate]
  );

  const handleFocus = useCallback(
    (e: React.FocusEvent<HTMLDivElement>) => {
      onFocus?.(e);
      let visible = true;
      try {
        visible = (e.target as HTMLElement).matches(":focus-visible");
      } catch {
        // :focus-visible unsupported: show the ring
      }
      setFocusVisible(visible);
      activate();
    },
    [onFocus, activate]
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLDivElement>) => {
      onBlur?.(e);
      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
        setFocusVisible(false);
        deactivate();
      }
    },
    [onBlur, deactivate]
  );

  // Support wrapped-in-link pattern: when wrapped in <a> or button, focus on parent activates effect
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const parentInteractive = el.closest<HTMLElement>("a, button");
    if (!parentInteractive) return;

    const handleParentFocus = () => {
      let visible = true;
      try {
        visible = parentInteractive.matches(":focus-visible");
      } catch {
        // fallback
      }
      setFocusVisible(visible);
      activate();
    };

    const handleParentBlur = (e: FocusEvent) => {
      if (!parentInteractive.contains(e.relatedTarget as Node | null)) {
        setFocusVisible(false);
        deactivate();
      }
    };

    parentInteractive.addEventListener("focus", handleParentFocus as EventListener);
    parentInteractive.addEventListener("blur", handleParentBlur as EventListener);
    return () => {
      parentInteractive.removeEventListener("focus", handleParentFocus as EventListener);
      parentInteractive.removeEventListener("blur", handleParentBlur as EventListener);
    };
  }, [activate, deactivate]);

  // When leaving the viewport, immediately release any lease and cancel idle timers
  useEffect(() => {
    if (!inView) {
      clearIdleTimer();
      setNeedsLease(false);
      setIsHovered(false);
    }
  }, [inView, clearIdleTimer]);

  // Context lease management with S8-11 retry subscription
  useEffect(() => {
    const shouldAcquire =
      hydrated &&
      inView &&
      needsLease &&
      effectiveTier >= 2 &&
      !prefersReduced &&
      isFinePointer &&
      !taintedCORS &&
      !glFailed;

    let unsubscribeBudget: (() => void) | null = null;

    const requestInteractiveLease = () => {
      if (leaseRef.current) return;
      const acquired = glBudget.acquire({
        id: instanceId.current,
        priority: 2, // Active hover has elevated priority over ambient backgrounds
        onEvict: () => {
          // Evicted (idle LRU, or by a higher-priority item). The next pointer move asks again.
          leaseRef.current = null;
          setHasLease(false);
          setNeedsLease(false);
          setIsHovered(false);
        },
      });
      if (acquired) {
        leaseRef.current = acquired;
        setHasLease(true);
      }
    };

    if (shouldAcquire) {
      requestInteractiveLease();
      // S8-11: Subscribe to budget frees so waiting visible items retry lease acquisition
      unsubscribeBudget = glBudget.subscribe(() => {
        if (!leaseRef.current) {
          requestInteractiveLease();
        }
      });
    } else if (leaseRef.current) {
      leaseRef.current.release(); // @frictionborn-guard
      leaseRef.current = null;
      setHasLease(false);
    }

    return () => {
      unsubscribeBudget?.();
      if (leaseRef.current) {
        leaseRef.current.release(); // @frictionborn-guard
        leaseRef.current = null;
        setHasLease(false);
      }
    };
  }, [hydrated, inView, needsLease, effectiveTier, prefersReduced, isFinePointer, taintedCORS, glFailed]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
      if (leaseRef.current) {
        leaseRef.current.release(); // @frictionborn-guard
        leaseRef.current = null;
      }
    };
  }, []);

  const markImageReady = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;
    if (typeof img.decode === "function") {
      img.decode().then(
        () => setImgLoaded(true),
        () => setImgLoaded(true)
      );
    } else {
      setImgLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (imgRef.current?.complete) {
      markImageReady();
    }
  }, [src, markImageReady]);

  const handleImageLoad = markImageReady;

  const handleTaintedCORS = useCallback(() => {
    setTaintedCORS(true);
    if (leaseRef.current) {
      leaseRef.current.release(); // @frictionborn-guard
      leaseRef.current = null;
      setHasLease(false);
    }
  }, []);

  const handleInitError = useCallback(() => {
    setGlFailed(true);
    if (leaseRef.current) {
      leaseRef.current.release(); // @frictionborn-guard
      leaseRef.current = null;
      setHasLease(false);
    }
  }, []);

  const shouldRenderGL =
    hydrated &&
    hasLease &&
    imgLoaded &&
    !taintedCORS &&
    !glFailed &&
    !prefersReduced &&
    isFinePointer &&
    effectiveTier >= 2;

  return (
    <div
      ref={containerRef}
      data-frictionborn-item="distortion-image"
      data-tier={effectiveTier}
      className={`relative inline-block overflow-hidden ${className}`}
      style={{
        position: "relative",
        display: "inline-block",
        overflow: "hidden",
        outline: "none", // the ring below replaces the default outline
        width,
        height,
        ...style,
      }}
      {...props}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      {/* Real HTML <img> is always in DOM, defines layout, and provides accessible semantics */}
      <img
        ref={imgRef}
        data-frictionborn-poster=""
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        decoding={decoding}
        fetchPriority={fetchPriority ?? fetchpriority}
        crossOrigin={crossOrigin}
        srcSet={srcSet}
        sizes={sizes}
        onLoad={handleImageLoad}
        className={`w-full h-full object-cover block select-none ${imgClassName}`}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
          userSelect: "none",
          ...imgStyle,
        }}
      />

      {/* WebGL2 Canvas Overlay: loaded via React.lazy + Suspense only when lease acquired */}
      {shouldRenderGL && (
        <Suspense fallback={null}>
          <DistortionImageGL
            imageElement={imgRef.current}
            pointerPos={pointerPos}
            isHovered={isHovered}
            strength={strength}
            speed={speed}
            tier={effectiveTier}
            onDowngrade={() => {
              if (leaseRef.current) {
                leaseRef.current.release(); // @frictionborn-guard
                leaseRef.current = null;
                setHasLease(false);
              }
            }}
            onTaintedCORS={handleTaintedCORS}
            onInitError={handleInitError}
          />
        </Suspense>
      )}

      {children && (
        <div style={{ position: "absolute", inset: 0, zIndex: 3, pointerEvents: "auto" }}>
          {children}
        </div>
      )}

      {focusVisible && <span aria-hidden="true" data-frictionborn-focus-ring="" style={FOCUS_RING_STYLE} />}
    </div>
  );
}
