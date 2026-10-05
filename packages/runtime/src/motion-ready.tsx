// Original — Frictionborn Motion MotionReadyScript (ARCHITECTURE.md §3)
import React from "react";

export interface MotionReadyScriptProps {
  nonce?: string;
}

const scriptContent = `(function(){try{if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.setAttribute('data-motion','ok');}}catch(e){}})();`;

export const MOTION_READY_SCRIPT_HASH = "sha256-0rCKN4IxkW0L6T5owlXyjvucXpltGt0wY4vp1j8aAHc=";

export function MotionReadyScript({ nonce }: MotionReadyScriptProps = {}): React.JSX.Element {
  return (
    <script
      id="frictionborn-motion-ready"
      nonce={nonce}
      dangerouslySetInnerHTML={{ __html: scriptContent }}
    />
  );
}

export function initMotionReady(): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  try {
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.documentElement.setAttribute("data-motion", "ok");
    }
  } catch {}
}

