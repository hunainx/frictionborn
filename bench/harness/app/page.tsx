// Original — Frictionborn Motion bench harness index
import React from "react";
import Link from "next/link";
import fs from "node:fs";
import path from "node:path";

export default function HarnessIndex() {
  const itemsDir = path.join(process.cwd(), "registry", "items");
  let items: string[] = [];

  if (fs.existsSync(itemsDir)) {
    items = fs
      .readdirSync(itemsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "2rem 0" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 600, letterSpacing: "-0.02em" }}>
          Registered Benchmark Items
        </h1>
        <p style={{ color: "var(--muted)", fontSize: "0.95rem", marginTop: "0.5rem" }}>
          Select an item below to run manual or automated Playwright probe benchmarks.
        </p>
      </div>

      <div style={{ display: "grid", gap: "1rem" }}>
        {items.length === 0 ? (
          <div
            style={{
              padding: "2rem",
              border: "1px solid var(--line)",
              borderRadius: 6,
              background: "var(--surface)",
              color: "var(--muted)",
            }}
          >
            No registry items found.
          </div>
        ) : (
          items.map((name) => (
            <div
              key={name}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "1.25rem",
                border: "1px solid var(--line)",
                borderRadius: 6,
                background: "var(--surface)",
              }}
            >
              <div>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 500 }}>
                  <Link href={`/items/${name}`}>{name}</Link>
                </h2>
                <span
                  className="mono"
                  style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: "0.25rem", display: "block" }}
                >
                  /items/{name}
                </span>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <Link
                  href={`/items/${name}?tier=0`}
                  style={{
                    padding: "0.25rem 0.5rem",
                    fontSize: "0.75rem",
                    border: "1px solid var(--line)",
                    borderRadius: 4,
                  }}
                >
                  T0 Static
                </Link>
                <Link
                  href={`/items/${name}?tier=3`}
                  style={{
                    padding: "0.25rem 0.5rem",
                    fontSize: "0.75rem",
                    border: "1px solid var(--line)",
                    borderRadius: 4,
                  }}
                >
                  T3 Full
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
