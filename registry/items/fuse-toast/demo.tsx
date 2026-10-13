// Original — Frictionborn Motion FuseToast demo
"use client";

import React, { useState } from "react";
import { FuseToast } from "./fuse-toast";

const BTN: React.CSSProperties = { minHeight: 34, padding: "0 14px", borderRadius: 999, border: "1px solid rgba(233,229,223,.18)", background: "#1d1a18", color: "#E9E5DF", fontSize: 13, cursor: "pointer" };

export default function FuseToastDemo() {
  const [archived, setArchived] = useState(false);
  const [open, setOpen] = useState(false);
  return (
    <section aria-label="FuseToast demo" style={{ maxWidth: 520, margin: "0 auto", padding: "20px", background: "#0c0b0a", color: "#E9E5DF", borderRadius: 18, display: "grid", gap: 40 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12, border: "1px solid rgba(233,229,223,.16)", background: "#161412", fontSize: 14, opacity: archived ? 0.35 : 1 }}>
        <span style={{ flex: 1 }}>Re: the bench results for the next release</span>
        <button
          type="button"
          style={BTN}
          onClick={() => {
            if (archived) { setArchived(false); setOpen(false); return; }
            setArchived(true);
            setOpen(true);
          }}
        >
          {archived ? "Restore" : "Archive"}
        </button>
      </div>
      <FuseToast
        open={open}
        message="Message archived."
        expiredMessage="Archived for good."
        onAction={() => setArchived(false)}
        onClose={() => setOpen(false)}
      />
    </section>
  );
}
