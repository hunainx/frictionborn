// Original — Frictionborn Motion: which JSON files in a public/r directory are registry items.
// public/r also holds the registry index (index.json) and, in the library repository, the size report written by
// scripts/build-sizes.ts (performance-sizes.json, an array). Both are served next to the items but are not items: the install
// smoke test and the fresh-apps check failed on "performance-sizes.json" when they treated every JSON file as one.
import fs from "node:fs";

export const NOT_REGISTRY_ITEMS: ReadonlySet<string> = new Set(["index.json", "performance-sizes.json"]);

/** The registry item files (`<name>.json`) in a public/r directory, sorted. */
export function registryItemFiles(publicRDir: string): string[] {
  return fs
    .readdirSync(publicRDir)
    .filter((f) => f.endsWith(".json") && !NOT_REGISTRY_ITEMS.has(f))
    .sort();
}
