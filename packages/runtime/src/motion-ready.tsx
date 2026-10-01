// Original — Frictionborn Motion MotionReadyScript (ARCHITECTURE.md §3)
import React from "react";

const scriptContent = `(function(){try{if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.setAttribute('data-motion','ok');}}catch(e){}})();`;

export function MotionReadyScript(): React.JSX.Element {
  return (
    <script
      id="frictionborn-motion-ready"
      dangerouslySetInnerHTML={{ __html: scriptContent }}
    />
  );
}
