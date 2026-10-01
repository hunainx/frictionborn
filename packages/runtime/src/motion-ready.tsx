// Original — Frictionborn Motion MotionReadyScript (ARCHITECTURE.md §3)
import React from "react";

export interface MotionReadyScriptProps {
  nonce?: string;
}

const scriptContent = `(function(){try{if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.setAttribute('data-motion','ok');}}catch(e){}})();`;

export function MotionReadyScript({ nonce }: MotionReadyScriptProps = {}): React.JSX.Element {
  return (
    <script
      id="frictionborn-motion-ready"
      nonce={nonce}
      dangerouslySetInnerHTML={{ __html: scriptContent }}
    />
  );
}
