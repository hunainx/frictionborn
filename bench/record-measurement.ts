// Original — Frictionborn Motion benchmark measurement recorder
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export interface ItemMeasurementPayload {
  cls?: number;
  framesWhenIdle?: {
    offscreen?: number;
    hiddenTab?: number;
    reducedMotion?: number;
  };
  axe?: {
    serious: number;
    critical: number;
  };
}

export function recordMeasurement(itemName: string, payload: ItemMeasurementPayload): void {
  const dir = path.join(process.cwd(), "bench", "results", itemName, "raw");
  fs.mkdirSync(dir, { recursive: true });
  const id = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
  const filePath = path.join(dir, `measurement-${id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2) + "\n", "utf8");
}
