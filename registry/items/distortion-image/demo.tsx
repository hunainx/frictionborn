// Original — Frictionborn Motion DistortionImage interactive gallery showcase
"use client";

import React, { useState, useEffect } from "react";
import { DistortionImage } from "./distortion-image";
import {
  glBudget,
  usePaused,
  useReducedMotion,
  useCapability,
  useHydrated,
} from "@frictionborn/runtime";

interface Artwork {
  id: string;
  title: string;
  category: string;
  date: string;
  medium: string;
  src: string;
  alt: string;
}

const ARTWORKS: Artwork[] = [
  {
    id: "art-1",
    title: "Field Study in Golden Wheat",
    category: "Landscape specimen",
    date: "1889",
    medium: "Archival plate",
    src: "/assets/distortion/art-1.webp",
    alt: "A painted wheat field in gold, with tall dark green cypresses under a swirling sky",
  },
  {
    id: "art-4",
    title: "Ocean Wave Crest Study",
    category: "Wave and mountain",
    date: "ca. 1830–32",
    medium: "Archival woodblock plate",
    src: "/assets/distortion/art-4.webp",
    alt: "A huge curling wave over long rowing boats, with a small snowy peak behind",
  },
  {
    id: "art-2",
    title: "Iris Botanical Study",
    category: "Flora specimen",
    date: "1890",
    medium: "Archival plate",
    src: "/assets/distortion/art-2.webp",
    alt: "Blue irises with green leaves in a white jug on a green table, pale wall behind",
  },
  {
    id: "art-5",
    title: "Sunflowers Study",
    category: "Flora specimen",
    date: "1887",
    medium: "Archival plate",
    src: "/assets/distortion/art-5.webp",
    alt: "Two dried sunflower heads lying on a swirling blue background",
  },
  {
    id: "art-3",
    title: "Nocturnal Cypresses Study",
    category: "Atmospheric study",
    date: "1889",
    medium: "Archival plate",
    src: "/assets/distortion/art-3.webp",
    alt: "Two tall cypresses in swirling green strokes, a pale crescent moon and blue hills",
  },
  {
    id: "art-6",
    title: "Pastoral Shoreline Study",
    category: "Figures in landscape",
    date: "1891",
    medium: "Archival plate",
    src: "/assets/distortion/art-6.webp",
    alt: "Three figures and a water jug in a rocky cove, the sea beyond",
  },
];

export default function DistortionImageDemo() {
  const [strength, setStrength] = useState<number>(0.25);
  const [speed, setSpeed] = useState<number>(1.0);
  const [colorMode, setColorMode] = useState<"dark" | "light">("dark");
  const [activeContexts, setActiveContexts] = useState<number>(0);

  const isLight = colorMode === "light";
  const hydrated = useHydrated();
  const isPaused = usePaused();
  const prefersReduced = useReducedMotion();
  const cap = useCapability();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const syncTheme = () => {
      const isLightClass = document.documentElement.className.includes("light");
      setColorMode(isLightClass ? "light" : "dark");
    };
    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, { attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const updateActive = () => setActiveContexts(glBudget.getActiveCount());
    updateActive();
    const unsub = glBudget.subscribe(updateActive);
    const interval = setInterval(updateActive, 350);
    return () => {
      unsub();
      clearInterval(interval);
    };
  }, []);

  const toggleTheme = () => {
    const nextMode = colorMode === "dark" ? "light" : "dark";
    setColorMode(nextMode);
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("light", nextMode === "light");
      document.documentElement.classList.toggle("dark", nextMode === "dark");
      if (nextMode === "light") {
        document.documentElement.setAttribute("data-theme", "light");
      } else {
        document.documentElement.removeAttribute("data-theme");
      }
      window.dispatchEvent(new CustomEvent("themechange"));
    }
  };

  return (
    <div
      className="fb-gallery-root"
      style={{
        display: "grid",
        gridTemplateColumns: "1fr",
        rowGap: "2rem",
        padding: "2rem",
        borderRadius: "12px",
        background: isLight ? "#FAFAFA" : "#090B0F",
        color: isLight ? "#111827" : "#F3F4F6",
        border: `1px solid ${isLight ? "#E5E7EB" : "#1F2937"}`,
      }}
    >
      {/* Gallery Header */}
      <header className="gallery-curation-head">
        <h1
          style={{
            fontSize: "2.25rem",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            margin: "0 0 0.5rem 0",
          }}
        >
          Heat haze over six paintings
        </h1>
        <p
          style={{
            margin: 0,
            color: isLight ? "#374151" : "#D1D5DB",
            fontSize: "1rem",
            lineHeight: 1.6,
            maxWidth: "640px",
          }}
        >
          Move your mouse over a painting and it ripples like air above a flame. You can also press Tab to reach
          a painting. On touch screens, or when your device asks for less motion, the pictures stay still.
        </p>
      </header>

      {/* Verified Live Status Panel */}
      <section
        aria-label="Live status"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "1rem",
          padding: "1rem 1.25rem",
          borderRadius: "8px",
          backgroundColor: isLight ? "#FFFFFF" : "rgba(255, 255, 255, 0.03)",
          border: `1px solid ${isLight ? "#E5E7EB" : "#262B33"}`,
        }}
      >
        <div>
          <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: isLight ? "#374151" : "#D1D5DB" }}>
            Rippling now
          </div>
          <div
            suppressHydrationWarning
            style={{ fontSize: "1.25rem", fontWeight: 700, marginTop: "0.25rem", color: activeContexts > 0 ? "#38BDF8" : "inherit" }}
          >
            {hydrated ? `${activeContexts} (limit ${glBudget.getMaxContexts()})` : "-"}
          </div>
        </div>

        <div>
          <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: isLight ? "#374151" : "#D1D5DB" }}>
            Device level
          </div>
          <div
            suppressHydrationWarning
            style={{ fontSize: "1.25rem", fontWeight: 700, marginTop: "0.25rem" }}
          >
            {hydrated ? `Level ${cap.tier} of 3` : "-"}
          </div>
        </div>

        <div>
          <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: isLight ? "#374151" : "#D1D5DB" }}>
            Reduced motion setting
          </div>
          <div
            suppressHydrationWarning
            style={{ fontSize: "1.25rem", fontWeight: 700, marginTop: "0.25rem" }}
          >
            {hydrated ? (prefersReduced ? "On: pictures stay still" : "Off") : "-"}
          </div>
        </div>

        <div>
          <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: isLight ? "#374151" : "#D1D5DB" }}>
            Animation
          </div>
          <div style={{ fontSize: "1.25rem", fontWeight: 700, marginTop: "0.25rem", color: prefersReduced || isPaused ? "#F59E0B" : "#10B981" }}>
            {prefersReduced ? "Off" : isPaused ? "Paused" : "Playing"}
          </div>
        </div>
      </section>

      {/* Interactive Controls Bar - Minimum 44px touch targets */}
      <section
        aria-label="Gallery Controls"
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "1.25rem",
          padding: "1rem 1.25rem",
          borderRadius: "8px",
          backgroundColor: isLight ? "#FFFFFF" : "rgba(255, 255, 255, 0.02)",
          border: `1px solid ${isLight ? "#E5E7EB" : "#262B33"}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minHeight: "44px" }}>
          <label htmlFor="distortion-strength" style={{ fontSize: "0.85rem", fontWeight: 500, minWidth: "85px" }}>
            Strength: {strength.toFixed(2)}
          </label>
          <input
            id="distortion-strength"
            type="range"
            min="0.05"
            max="0.60"
            step="0.05"
            value={strength}
            onChange={(e) => setStrength(parseFloat(e.target.value))}
            style={{ width: "120px", height: "44px", cursor: "pointer" }}
            aria-label="Displacement strength"
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minHeight: "44px" }}>
          <label htmlFor="distortion-speed" style={{ fontSize: "0.85rem", fontWeight: 500, minWidth: "80px" }}>
            Speed: {speed.toFixed(1)}x
          </label>
          <input
            id="distortion-speed"
            type="range"
            min="0.2"
            max="2.5"
            step="0.1"
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            style={{ width: "120px", height: "44px", cursor: "pointer" }}
            aria-label="Animation speed"
          />
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={toggleTheme}
            style={{
              minHeight: "44px",
              minWidth: "44px",
              padding: "0 1.25rem",
              borderRadius: "6px",
              border: `1px solid ${isLight ? "#D1D5DB" : "#374151"}`,
              backgroundColor: "transparent",
              color: "inherit",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {isLight ? "Dark Theme" : "Light Theme"}
          </button>
        </div>
      </section>

      {/* Featured Primary Work */}
      <article
        id="featured-artwork"
        data-testid="featured-artwork"
        style={{
          borderRadius: "10px",
          border: `1px solid ${isLight ? "#E5E7EB" : "#1F2937"}`,
          overflow: "hidden",
          backgroundColor: isLight ? "#FFFFFF" : "#11141B",
        }}
      >
        <div style={{ width: "100%", height: "460px", position: "relative", backgroundColor: isLight ? "#E5E7EB" : "#0B0E14" }}>
          <DistortionImage
            src={ARTWORKS[0].src}
            alt={ARTWORKS[0].alt}
            strength={strength}
            speed={speed}
            style={{ width: "100%", height: "100%" }}
            imgStyle={{ width: "100%", height: "100%", objectFit: "cover" }}
          >
            <div
              style={{
                position: "absolute",
                bottom: "1rem",
                left: "1rem",
                padding: "0.5rem 0.85rem",
                borderRadius: "4px",
                background: isLight ? "rgba(255, 255, 255, 0.90)" : "rgba(8, 10, 14, 0.82)",
                color: isLight ? "#0F172A" : "#F1F5F9",
                fontSize: "0.8rem",
                fontWeight: 600,
                backdropFilter: "blur(8px)",
                border: `1px solid ${isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.12)"}`,
              }}
            >
              Wheat and cypresses
            </div>
          </DistortionImage>
        </div>
        <div style={{ padding: "1.25rem 1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "0.5rem" }}>
            <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 600 }}>
              {ARTWORKS[0].title}
            </h2>
            <span style={{ fontSize: "0.85rem", color: isLight ? "#374151" : "#D1D5DB" }}>
              {ARTWORKS[0].category}, {ARTWORKS[0].date}
            </span>
          </div>
          <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.9rem", color: isLight ? "#374151" : "#D1D5DB" }}>
            {ARTWORKS[0].medium}. Public domain collection (CC0 1.0).
          </p>
        </div>
      </article>

      {/* Gallery Grid */}
      <section
        aria-label="Frictionborn gallery"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {ARTWORKS.slice(1).map((artwork) => (
          <article
            key={artwork.id}
            style={{
              borderRadius: "10px",
              border: `1px solid ${isLight ? "#E5E7EB" : "#1F2937"}`,
              overflow: "hidden",
              backgroundColor: isLight ? "#FFFFFF" : "#11141B",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ width: "100%", height: "240px", position: "relative", backgroundColor: isLight ? "#E5E7EB" : "#0B0E14" }}>
              <DistortionImage
                src={artwork.src}
                alt={artwork.alt}
                strength={strength}
                speed={speed}
                style={{ width: "100%", height: "100%" }}
                imgStyle={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            <div style={{ padding: "1rem 1.25rem", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>
                  {artwork.title}
                </h3>
                <div style={{ fontSize: "0.85rem", color: isLight ? "#374151" : "#D1D5DB", marginTop: "0.25rem" }}>
                  {artwork.category}, {artwork.date}
                </div>
              </div>
              <div style={{ fontSize: "0.75rem", color: isLight ? "#374151" : "#D1D5DB", marginTop: "0.75rem" }}>
                {artwork.medium}
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
