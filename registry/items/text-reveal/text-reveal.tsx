// Original — Frictionborn Motion TextReveal
"use client";

import React, { useEffect, useRef, useState, useMemo, useId } from "react";
import { useReducedMotion, useCapability, useHydrated } from "@frictionborn/runtime";

export interface TextRevealProps {
  children: string;
  as?: React.ElementType;
  by?: "word" | "character" | "line";
  delay?: number;
  stagger?: number;
  duration?: number;
  className?: string;
  style?: React.CSSProperties;
  maxTier?: number;
  replayKey?: string | number;
}

export function TextReveal({
  children,
  as: Component = "h1",
  by = "word",
  delay = 0,
  stagger = 60,
  duration = 400,
  className = "",
  style,
  maxTier = 3,
  replayKey,
}: TextRevealProps) {
  const containerRef = useRef<HTMLElement>(null);
  const id = useId();
  const hydrated = useHydrated();
  const prefersReduced = useReducedMotion();
  const { tier: rawTier } = useCapability();
  const tier = Math.min(rawTier, maxTier);

  // Check if this component was pre-rendered in SSR HTML
  const isSsrInitial = useRef<boolean | null>(null);
  if (isSsrInitial.current === null) {
    if (typeof document !== "undefined") {
      const el = document.getElementById(id);
      isSsrInitial.current = Boolean(el && el.getAttribute("data-ssr") === "true");
    } else {
      isSsrInitial.current = true;
    }
  }

  // When replayKey changes, allow animated re-reveal even if initially SSR-rendered
  const prevReplayRef = useRef(replayKey);
  if (prevReplayRef.current !== replayKey) {
    prevReplayRef.current = replayKey;
    isSsrInitial.current = false;
  }

  const isSsrPainted = isSsrInitial.current && replayKey === undefined;
  const shouldAnimate = hydrated && !prefersReduced && tier > 0 && !isSsrPainted;

  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);

  // Wait for web fonts before measuring layout for line splitting
  useEffect(() => {
    if (typeof document !== "undefined" && "fonts" in document) {
      document.fonts.ready.then(() => setFontsLoaded(true)).catch(() => setFontsLoaded(true));
    } else {
      setFontsLoaded(true);
    }
  }, []);

  // Track container width for line re-splitting
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, [hydrated]);

  // Adjust stagger on mobile / tier 1
  const effectiveStagger = tier <= 1 ? Math.min(stagger, 40) : stagger;

  // Split text into tokens
  const tokens = useMemo(() => {
    if (!children || typeof children !== "string") return [];
    if (by === "character") {
      // Split into words first to prevent mid-word line breaking
      const words = children.split(/(\s+)/);
      let charIndex = 0;
      return words.map((segment) => {
        if (/^\s+$/.test(segment)) {
          return { isSpace: true, text: segment, chars: [] };
        }
        const chars = Array.from(segment).map((ch) => ({
          char: ch,
          index: charIndex++,
        }));
        return { isSpace: false, text: segment, chars };
      });
    }

    // Word mode default
    const rawTokens = children.split(/(\s+)/);
    let wordIndex = 0;
    return rawTokens.map((tok) => {
      const isSpace = /^\s+$/.test(tok);
      return {
        text: tok,
        isSpace,
        index: isSpace ? -1 : wordIndex++,
      };
    });
  }, [children, by]);

  // Words only (no whitespace tokens): line groups index into this list
  const words = useMemo(() => tokens.filter((t: any) => !t.isSpace), [tokens]);

  // Line splitting after fonts load
  const [lineGroups, setLineGroups] = useState<number[][]>([]);
  // Width or text changed: drop the grouping so the flat word spans render and can be re-measured
  useEffect(() => {
    if (by === "line") setLineGroups([]);
  }, [by, containerWidth, children, replayKey]);

  useEffect(() => {
    if (by !== "line" || !fontsLoaded || lineGroups.length > 0 || !containerRef.current) return;
    const wordElements = containerRef.current.querySelectorAll<HTMLElement>("[data-tr-word]");
    if (wordElements.length === 0) return;

    const lines: number[][] = [];
    let currentLine: number[] = [];
    let currentTop = -1;

    wordElements.forEach((el, idx) => {
      const top = el.offsetTop;
      if (currentTop === -1 || Math.abs(top - currentTop) < 4) {
        currentLine.push(idx);
        currentTop = top;
      } else {
        lines.push(currentLine);
        currentLine = [idx];
        currentTop = top;
      }
    });
    if (currentLine.length > 0) lines.push(currentLine);
    setLineGroups(lines);
  }, [by, fontsLoaded, lineGroups.length, children, replayKey]);

  return (
    <Component
      ref={containerRef as any}
      id={id}
      data-frictionborn-item="text-reveal"
      data-ssr={!hydrated ? "true" : undefined}
      data-tier={tier}
      className={`fb-text-reveal ${className}`}
      style={{
        position: "relative",
        display: "block",
        ...style,
      }}
    >
      <style>{`
        [data-motion="ok"] .fb-tr-token {
          display: inline-block;
          opacity: 0;
          transform: translateY(var(--fb-distance, 20px));
          animation: fb-tr-fade-up var(--fb-tr-dur, 400ms) cubic-bezier(0.22, 1, 0.36, 1) forwards;
          animation-delay: var(--fb-tr-del, 0ms);
          will-change: transform, opacity;
        }
        @media (prefers-reduced-motion: reduce) {
          [data-motion="ok"] .fb-tr-token {
            opacity: 1 !important;
            transform: none !important;
            animation: none !important;
          }
        }
        @keyframes fb-tr-fade-up {
          from {
            opacity: 0;
            transform: translateY(var(--fb-distance, 20px));
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {/* Screen reader unfragmented text */}
      <span
        style={{
          position: "absolute",
          width: "1px",
          height: "1px",
          padding: 0,
          margin: "-1px",
          overflow: "hidden",
          clip: "rect(0, 0, 0, 0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      >
        {children}
      </span>

      {/* Visual content: static in SSR/reduced motion, split tokens when animated */}
      {!shouldAnimate ? (
        <span aria-hidden="true">{children}</span>
      ) : (
        <span aria-hidden="true" key={String(replayKey ?? "default")}>
          {by === "character" &&
            tokens.map((group: any, gIdx) =>
              group.isSpace ? (
                <span key={gIdx}>{group.text}</span>
              ) : (
                <span key={gIdx} style={{ display: "inline-block", whiteSpace: "nowrap" }}>
                  {group.chars.map((c: any) => (
                    <span
                      key={c.index}
                      className="fb-tr-token"
                      style={
                        {
                          "--fb-tr-dur": `${duration}ms`,
                          "--fb-tr-del": `${delay + c.index * effectiveStagger}ms`,
                        } as React.CSSProperties
                      }
                    >
                      {c.char}
                    </span>
                  ))}
                </span>
              )
            )}

          {by === "word" &&
            tokens.map((token: any, idx) =>
              token.isSpace ? (
                <span key={idx}>{token.text}</span>
              ) : (
                <span
                  key={idx}
                  className="fb-tr-token"
                  style={
                    {
                      "--fb-tr-dur": `${duration}ms`,
                      "--fb-tr-del": `${delay + token.index * effectiveStagger}ms`,
                    } as React.CSSProperties
                  }
                >
                  {token.text}
                </span>
              )
            )}

          {by === "line" && (
            <span style={{ display: "block" }}>
              {lineGroups.length === 0
                ? tokens.map((token: any, idx) => (
                    <span
                      key={idx}
                      data-tr-word={!token.isSpace ? "true" : undefined}
                      style={{ display: "inline-block" }}
                    >
                      {token.text}
                    </span>
                  ))
                : lineGroups.map((indices, lineIdx) => (
                    <span
                      key={lineIdx}
                      style={{
                        display: "block",
                        overflow: "hidden",
                      }}
                    >
                      <span
                        className="fb-tr-token"
                        style={
                          {
                            display: "inline-block",
                            "--fb-tr-dur": `${duration}ms`,
                            "--fb-tr-del": `${delay + lineIdx * (effectiveStagger * 1.5)}ms`,
                          } as React.CSSProperties
                        }
                      >
                        {indices.map((wIdx) => words[wIdx]?.text).join(" ")}
                      </span>
                    </span>
                  ))}
            </span>
          )}
        </span>
      )}
    </Component>
  );
}

export default TextReveal;
