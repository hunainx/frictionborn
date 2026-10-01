// Original — Frictionborn Motion
"use client";

import React from "react";
import { Dummy } from "./dummy";

export default function DummyDemo() {
  return (
    <div className="flex min-h-[300px] w-full items-center justify-center p-8 bg-neutral-950 text-neutral-100">
      <Dummy className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-6 text-center">
        <h2 className="text-xl font-semibold tracking-tight text-white">Dummy Component Demo</h2>
        <p className="mt-2 text-sm text-neutral-400">
          Used to verify the bench harness, probes, and metadata pipeline.
        </p>
      </Dummy>
    </div>
  );
}
