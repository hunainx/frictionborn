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
  srcSet,
  sizes,
  imgClassName = "",
  imgStyle,
  className = "",
  style,
  children,
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
  const [isFinePointer, setIsFinePointer] = useState(false);

  // Detect fine pointer capability (mouse/pen) vs coarse touch
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const media = window.matchMedia("(pointer: fine)");
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

  const handlePointerInteraction = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.pointerType === "touch") return; // Touch pointers fall back to plain image (0 contexts)
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
      setIsHovered(true);
      setNeedsLease(true);
      updatePointer(e);
    },
    [updatePointer]
  );

  const handlePointerEnter = handlePointerInteraction;
  const handlePointerMove = handlePointerInteraction;

  const scheduleIdleRelease = useCallback(() => {
    setIsHovered(false);
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    // Release the lease after 3 seconds of idle
    idleTimerRef.current = setTimeout(() => {
      setNeedsLease(false);
    }, 3000);
  }, []);

  const handlePointerLeave = scheduleIdleRelease;
  const handleBlur = scheduleIdleRelease;

  const handleFocus = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    setIsHovered(true);
    setNeedsLease(true);
  }, []);

  // When leaving the viewport, immediately release any lease and cancel idle timers
  useEffect(() => {
    if (!inView) {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
      setNeedsLease(false);
      setIsHovered(false);
    }
  }, [inView]);

  // Context lease management with S8-11 retry subscription
  useEffect(() => {
    const shouldAcquire =
      hydrated &&
      inView &&
      needsLease &&
      effectiveTier >= 2 &&
      !prefersReduced &&
      isFinePointer &&
      !taintedCORS;

    let unsubscribeBudget: (() => void) | null = null;

    const requestInteractiveLease = () => {
      if (leaseRef.current) return;
      const acquired = glBudget.acquire({
        id: instanceId.current,
        priority: 2, // Active hover has elevated priority over ambient backgrounds
        onEvict: () => {
          leaseRef.current = null;
          setHasLease(false);
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
  }, [hydrated, inView, needsLease, effectiveTier, prefersReduced, isFinePointer, taintedCORS]);

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

  const shouldRenderGL =
    hydrated &&
    hasLease &&
    imgLoaded &&
    !taintedCORS &&
    !prefersReduced &&
    isFinePointer &&
    effectiveTier >= 2;

  return (
    <div
      ref={containerRef}
      data-frictionborn-item="distortion-image"
      data-tier={effectiveTier}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      tabIndex={0}
      className={`relative inline-block overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${className}`}
      style={{
        position: "relative",
        display: "inline-block",
        overflow: "hidden",
        width,
        height,
        ...style,
      }}
      {...props}
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
          />
        </Suspense>
      )}

      {children && (
        <div style={{ position: "relative", zIndex: 3, pointerEvents: "auto" }}>
          {children}
        </div>
      )}
    </div>
  );
}
