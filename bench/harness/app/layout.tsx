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
    <html lang="en" data-fb-tier="3" suppressHydrationWarning>
      <head>
        {/* Inject probes synchronously before any application scripts run */}
        <script src="/probes.js" />
        <MotionReadyScript />
      </head>
      <body className="antialiased min-h-screen flex flex-col">
        <header className="border-b border-[#262B33] bg-[#15181D]/80 backdrop-blur px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full bg-[#FB923C]" />
            <a href="/" className="font-semibold tracking-tight text-[#E9EBF0] hover:text-[#FB923C] transition-colors">
              Frictionborn Motion · Bench Harness
            </a>
          </div>
          <div className="text-xs text-[#9AA1AF] mono">
            Next 16 · React 19 · WebGL2 Probes
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </body>
    </html>
  );
}
