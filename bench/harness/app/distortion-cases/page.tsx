// Original — Frictionborn Motion bench harness: DistortionImage edge cases (linked, srcset, cross-origin, next/image props)
"use client";

import React, { useEffect, use } from "react";
import { getImageProps } from "next/image";
import { DistortionImage } from "../../../../registry/items/distortion-image/distortion-image";

// A host that is a different origin from the harness and sends no CORS headers.
// The spec intercepts this URL with page.route and serves the artwork without CORS headers.
const CROSS_ORIGIN_SRC = "https://cdn.noncors.test/art-1.webp";

export default function DistortionCasesPage({
  searchParams,
}: {
  searchParams: Promise<{ tier?: string }>;
}) {
  const { tier } = use(searchParams);

  useEffect(() => {
    if (tier !== undefined) {
      document.documentElement.setAttribute("data-fb-tier", tier);
      return () => document.documentElement.removeAttribute("data-fb-tier");
    }
  }, [tier]);

  // next/image's documented escape hatch: getImageProps returns plain <img> props.
  const nextProps = getImageProps({
    src: "/assets/distortion/art-4.webp",
    alt: "The Great Wave by Hokusai (via next/image getImageProps)",
    width: 600,
    height: 403,
    sizes: "600px",
    unoptimized: true,
  }).props;

  return (
    <div data-testid="cases-root" style={{ padding: "1.5rem", display: "grid", gap: "1.5rem", maxWidth: 900 }}>
      <h1 style={{ fontSize: "1.25rem" }}>DistortionImage edge cases</h1>

      <section data-testid="case-linked">
        <a href="#linked-target" data-testid="case-linked-link" style={{ display: "inline-block" }}>
          <DistortionImage
            src="/assets/distortion/art-1.webp"
            alt="Linked: Wheat Field with Cypresses"
            width={400}
            height={318}
          />
        </a>
      </section>

      <section data-testid="case-overlaid">
        <DistortionImage
          src="/assets/distortion/art-2.webp"
          alt="Overlaid link: Irises"
          width={400}
          height={318}
        >
          <a
            href="#overlaid-target"
            data-testid="case-overlaid-link"
            style={{ position: "absolute", inset: 0 }}
            aria-label="View Irises by Van Gogh"
          />
        </DistortionImage>
      </section>

      <section data-testid="case-srcset">
        <DistortionImage
          src="/assets/distortion/art-1.webp"
          srcSet="/assets/distortion/art-1.webp 400w, /assets/distortion/art-2.webp 1200w"
          sizes="(max-width: 700px) 400px, 1200px"
          alt="Srcset: picks art-1 below 700px, art-2 above"
          width="100%"
          height={300}
        />
      </section>

      <section data-testid="case-cross-origin">
        <DistortionImage
          src={CROSS_ORIGIN_SRC}
          alt="Cross-origin without CORS headers"
          width={400}
          height={318}
        />
      </section>

      <section data-testid="case-next-image">
        <DistortionImage
          src={nextProps.src}
          srcSet={nextProps.srcSet}
          sizes={nextProps.sizes}
          alt={nextProps.alt}
          width={600}
          height={403}
        />
      </section>

      <section data-testid="case-default-props">
        <DistortionImage src="/assets/distortion/art-5.webp" alt="Default props only, no dimensions" />
      </section>
    </div>
  );
}
