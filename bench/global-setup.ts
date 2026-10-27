// Original — Frictionborn Motion: Playwright global setup for the bench (runs once before the specs).
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ensureDemoImages } from "./demo-images.ts";

export default async function globalSetup(): Promise<void> {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const written = await ensureDemoImages(root);
  if (written.length > 0) console.log(`✔ Drew ${written.length} demo image file(s) for the bench (not committed: the repo ships no media)`);
}
