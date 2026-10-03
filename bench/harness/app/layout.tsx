// Original — Frictionborn Motion bench harness layout
import React from "react";
import "./globals.css";
import { MotionReadyScript } from "@frictionborn/runtime";

export const metadata = {
  title: "Frictionborn Motion — Bench Harness",
  description: "Automated probe harness for verifying motion and WebGL components",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Inject probes synchronously before any application scripts run */}
        <script src="/probes.js" />
        <MotionReadyScript />
      </head>
      <body className="antialiased min-h-screen flex flex-col">
        <header
          style={{
            borderBottom: "1px solid var(--line, #262B33)",
            backgroundColor: "var(--surface, #15181D)",
            padding: "0.75rem 1.25rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "0.75rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "999px",
                backgroundColor: "var(--signal, #FB923C)",
                display: "inline-block",
                flexShrink: 0,
              }}
            />
            <a
              href="/"
              style={{
                fontWeight: 600,
                fontSize: "0.95rem",
                letterSpacing: "-0.01em",
                color: "var(--ink, #E9EBF0)",
                textDecoration: "none",
              }}
            >
              Frictionborn Motion · Bench Harness
            </a>
          </div>
          <div
            className="mono"
            style={{
              fontSize: "0.75rem",
              color: "var(--muted, #9AA1AF)",
            }}
          >
            Next 16 · React 19 · WebGL2 Probes
          </div>
        </header>
        <main style={{ flex: 1, padding: "1.5rem" }}>{children}</main>
      </body>
    </html>
  );
}
