// Original — Frictionborn Motion provenance and code standards checker
import fs from "node:fs";
import path from "node:path";
import { execSync, execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { getItemTrackedPaths, verifySnapshotIntegrity } from "./merge-evidence.ts";

const PROVENANCE_REGEX = /^(?:\/\/|\/\*)\s*(Original|Source:\s*https?:\/\/[^\s]+(?:\s*—\s*|\s*-\s*)[^\s]+(?:\s*—\s*|\s*-\s*).+)/m;
const FORBIDDEN_LICENSES = [/GPL/i, /AGPL/i, /LGPL/i, /Commons Clause/i, /CC-BY-NC/i, /Non-Commercial/i];

interface Violation {
  file: string;
  reason: string;
}

const violations: Violation[] = [];

function scanDirectory(dir: string) {
  if (!fs.existsSync(dir)) return;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (
        entry.name === "node_modules" ||
        entry.name === "dist" ||
        entry.name === ".next" ||
        entry.name === ".git" ||
        entry.name === "coverage"
      ) {
        continue;
      }
      scanDirectory(fullPath);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (ext === ".ts" || ext === ".tsx" || ext === ".js" || ext === ".jsx") {
        checkSourceFile(fullPath);
      } else if (ext === ".css") {
        checkCssFile(fullPath);
      }
    }
  }
}

function checkSourceFile(file: string) {
  const content = fs.readFileSync(file, "utf8");

  // 1. Check for provenance header in first 5 lines
  const firstLines = content.split("\n").slice(0, 5).join("\n");
  if (!PROVENANCE_REGEX.test(firstLines)) {
    violations.push({
      file,
      reason: "Missing provenance header (must start with '// Original' or '// Source: <url> — <licence> — <copyright>')",
    });
  }

  // 2. Check for copyleft/forbidden licenses
  for (const pattern of FORBIDDEN_LICENSES) {
    if (pattern.test(content)) {
      violations.push({
        file,
        reason: `Potential copyleft or non-commercial license detected: ${pattern}`,
      });
      break;
    }
  }

  // 3. Reject any React Bits identifiers (MIT + Commons Clause licence protection)
  const REACT_BITS_IDENTIFIERS = /\b(React\s*Bits|reactbits|Hyperspeed|InfiniteMenu|DriftWall|RippleDistortion|Ferrofluid|LiquidChrome|GhostFibers|Lightfall)\b/i;
  if (REACT_BITS_IDENTIFIERS.test(content)) {
    violations.push({
      file,
      reason: "React Bits identifier detected; React Bits is MIT + Commons Clause and strictly forbidden from copying or porting.",
    });
  }

  // 4. Check for direct requestAnimationFrame in component files (AGENTS.md rule 3)
  if (file.includes(path.join("registry", "items")) || file.includes(path.join("registry", "compositions"))) {
    if (/\b(?:window\.)?requestAnimationFrame\s*\(/.test(content)) {
      violations.push({
        file,
        reason: "Direct requestAnimationFrame usage forbidden in components; use useFrame from @frictionborn/runtime",
      });
    }
  }
}

function checkCssFile(file: string) {
  const content = fs.readFileSync(file, "utf8");

  // AGENTS.md rule 1: Hidden-before-reveal CSS only under [data-motion="ok"]
  // Check if opacity: 0 or off-screen transforms are declared without [data-motion="ok"]
  const lines = content.split("\n");
  let inMotionOkBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('[data-motion="ok"]')) {
      inMotionOkBlock = true;
    }
    if (inMotionOkBlock && line.includes("}")) {
      inMotionOkBlock = false;
    }

    if (!inMotionOkBlock) {
      if (/opacity:\s*0\b/.test(line) && !line.includes("/* ignore-static */")) {
        // Warning or violation if server-static css hides content outside motion-ready guard
        violations.push({
          file,
          reason: `Line ${i + 1}: Static CSS contains 'opacity: 0' outside [data-motion="ok"] (AGENTS.md Rule 1)`,
        });
      }
    }
  }
}

const PERMISSIVE_LICENSES = new Set([
  "MIT",
  "MIT-0",
  "Apache-2.0",
  "MIT AND Apache-2.0",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "ISC",
  "0BSD",
  "Python-2.0",
  "CC-BY-4.0",
  "CC0-1.0",
  "Unlicense",
  "Zlib",
]);

// Explicit dev-only exceptions (Audit M3b Fix 7: must have "dev-only, never shipped")
const DEV_ONLY_EXCEPTIONS: Record<string, { license: string; reason: string }> = {
  "axe-core": {
    license: "MPL-2.0",
    reason: "dev-only, never shipped",
  },
  "@axe-core/playwright": {
    license: "MPL-2.0",
    reason: "dev-only, never shipped",
  },
  "parse-cache-control": {
    license: "BSD",
    reason: "dev-only, never shipped (via @lhci/cli); its LICENSE file is the permissive 3-clause BSD text, only package.json lacks an SPDX id",
  },
  "sharp": {
    license: "Apache-2.0 AND LGPL-3.0-or-later",
    reason: "dev/server-only exception: sharp/libvips (LGPL-3.0), used only by Next's server-side image optimisation, dynamically linked, never in registry items, @frictionborn/runtime or public/r, not distributed to library users (owner approved 2026-10-21, DECISIONS 68)",
  },
  "spawndamnit": {
    license: "Unknown",
    reason: "dev-only, never shipped",
  },
  "lightningcss": {
    license: "MPL-2.0",
    reason: "dev-only, never shipped (build-time CSS tooling)",
  },
};

function isDevOnlyException(pkgName: string): boolean {
  if (DEV_ONLY_EXCEPTIONS[pkgName]) return true;
  if (pkgName.startsWith("@img/sharp-")) return true; // dev-only, never shipped
  if (pkgName.startsWith("lightningcss-")) return true; // dev-only, never shipped (platform binary)
  return false;
}

function isSharpPackageName(name: string): boolean {
  return name === "sharp" || name.startsWith("@img/sharp-");
}

function checkNoSharpInShippedArtifacts(projectRoot: string): Violation[] {
  const out: Violation[] = [];
  const sharpImportRe = /(?:from|import|require\s*\()\s*["'](?:sharp|@img\/sharp[^"']*)["']/;

  // 1. packages/runtime
  const runtimePkgPath = path.join(projectRoot, "packages", "runtime", "package.json");
  if (fs.existsSync(runtimePkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(runtimePkgPath, "utf8"));
      for (const field of ["dependencies", "peerDependencies", "optionalDependencies", "devDependencies"] as const) {
        const deps = pkg[field] ? Object.keys(pkg[field]) : [];
        for (const dep of deps) {
          if (isSharpPackageName(dep)) {
            out.push({
              file: runtimePkgPath,
              reason: `@frictionborn/runtime (${field}) must never depend on '${dep}' (DECISIONS 68: sharp/libvips is server-only).`,
            });
          }
        }
      }
    } catch {
      // ignore malformed test fixtures
    }
  }

  const walkForSharpImports = (dir: string, label: string) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === "node_modules" || entry.name === "dist") continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walkForSharpImports(full, label);
      } else if (/\.(ts|tsx|js|mjs)$/.test(entry.name)) {
        const content = fs.readFileSync(full, "utf8");
        if (sharpImportRe.test(content)) {
          out.push({
            file: full,
            reason: `${label} source file imports sharp/@img/sharp (DECISIONS 68: sharp/libvips is server-only and never shipped).`,
          });
        }
      }
    }
  };

  walkForSharpImports(path.join(projectRoot, "packages", "runtime", "src"), "@frictionborn/runtime");

  // 2. registry/items
  const itemsDir = path.join(projectRoot, "registry", "items");
  if (fs.existsSync(itemsDir)) {
    for (const entry of fs.readdirSync(itemsDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const itemDir = path.join(itemsDir, entry.name);
      for (const metaFile of ["meta.declared.json", "meta.json"]) {
        const metaPath = path.join(itemDir, metaFile);
        if (!fs.existsSync(metaPath)) continue;
        try {
          const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
          const npmDeps: Array<{ name?: string } | string> = meta.dependencies?.npm ?? [];
          for (const d of npmDeps) {
            const name = typeof d === "string" ? d : d?.name ?? "";
            if (isSharpPackageName(name)) {
              out.push({
                file: metaPath,
                reason: `Registry item '${entry.name}' (${metaFile}) must never depend on '${name}' (DECISIONS 68).`,
              });
            }
          }
        } catch {
          // ignore
        }
      }
      walkForSharpImports(itemDir, `Registry item '${entry.name}'`);
    }
  }

  // 3. public/r
  const publicRDir = path.join(projectRoot, "public", "r");
  if (fs.existsSync(publicRDir)) {
    for (const file of fs.readdirSync(publicRDir)) {
      if (!file.endsWith(".json")) continue;
      const full = path.join(publicRDir, file);
      try {
        const data = JSON.parse(fs.readFileSync(full, "utf8"));
        const allDeps = [
          ...(Array.isArray(data.dependencies) ? data.dependencies : []),
          ...(Array.isArray(data.devDependencies) ? data.devDependencies : []),
          ...(Array.isArray(data.registryDependencies) ? data.registryDependencies : []),
        ];
        for (const dep of allDeps) {
          if (typeof dep === "string" && (isSharpPackageName(dep) || dep.startsWith("sharp@") || dep.startsWith("@img/sharp-"))) {
            out.push({
              file: full,
              reason: `public/r/${file} must never depend on '${dep}' (DECISIONS 68).`,
            });
          }
        }
        for (const f of Array.isArray(data.files) ? data.files : []) {
          if (typeof f?.content === "string" && sharpImportRe.test(f.content)) {
            out.push({
              file: full,
              reason: `public/r/${file} (${f.target ?? "file"}) imports sharp/@img/sharp (DECISIONS 68).`,
            });
          }
        }
      } catch {
        // ignore
      }
    }
  }

  return out;
}

export function scanDependencyLicenses(
  projectRoot: string,
  licenseMapOverride?: Record<string, Array<{ name: string; versions: string[]; paths?: string[] }>>
): Violation[] {
  const localViolations: Violation[] = [];
  try {
    let licenseMap = licenseMapOverride;
    if (!licenseMap) {
      const isWin = process.platform === "win32";
      const cmd = isWin ? "pnpm.cmd licenses list --json" : "pnpm licenses list --json";
      const output = execSync(cmd, { cwd: projectRoot, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
      licenseMap = JSON.parse(output) as Record<string, Array<{ name: string; versions: string[]; paths?: string[] }>>;
    }

    const allowedSharpPathRe = /(?:^|\/)node_modules\/(?:sharp|@img\/sharp-[^/]+)$/;

    for (const [license, packages] of Object.entries(licenseMap)) {
      for (const pkg of packages) {
        if (isSharpPackageName(pkg.name) || /LGPL/i.test(license)) {
          if (!isSharpPackageName(pkg.name)) {
            localViolations.push({
              file: `node_modules/${pkg.name}`,
              reason: `Unapproved LGPL license '${license}' detected for '${pkg.name}'. Only sharp/libvips under node_modules/@img/sharp-* and node_modules/sharp is permitted (DECISIONS 68).`,
            });
            continue;
          }
          const pkgPaths = pkg.paths ?? [];
          for (const rawPath of pkgPaths) {
            const norm = rawPath.replace(/\\/g, "/");
            if (!allowedSharpPathRe.test(norm)) {
              localViolations.push({
                file: rawPath,
                reason: `sharp/libvips (LGPL-3.0) is only permitted under node_modules/@img/sharp-* and node_modules/sharp (found '${norm}').`,
              });
            }
          }
          continue;
        }

        if (PERMISSIVE_LICENSES.has(license)) {
          continue;
        }

        if (isDevOnlyException(pkg.name)) {
          // Explicitly allowed dev-only exception (dev-only, never shipped)
          continue;
        }

        localViolations.push({
          file: `node_modules/${pkg.name}`,
          reason: `Unapproved non-permissive license '${license}' detected for '${pkg.name}'. Only explicit dev-only exceptions ("dev-only, never shipped") are permitted.`,
        });
      }
    }

    localViolations.push(...checkNoSharpInShippedArtifacts(projectRoot));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    localViolations.push({
      file: "package.json",
      reason: `Failed to execute dependency license scan via pnpm licenses list: ${msg}`,
    });
  }
  violations.push(...localViolations);
  return localViolations;
}

function runJscpdCheck(projectRoot: string) {
  try {
    const isWin = process.platform === "win32";
    const cmd = isWin
      ? `cmd /c npx --yes jscpd@5.4.0 packages/runtime/src registry/items --ignore "**/*.json,**/*.test.*,**/*.spec.*" --threshold 0 --silent`
      : `npx --yes jscpd@5.4.0 packages/runtime/src registry/items --ignore "**/*.json,**/*.test.*,**/*.spec.*" --threshold 0 --silent`;
    execSync(cmd, { cwd: projectRoot, stdio: "pipe" });
  } catch {
    violations.push({
      file: "jscpd",
      reason: "Code duplication detected by jscpd. Run 'npx jscpd packages/runtime/src registry/items' to inspect.",
    });
  }
}

export function checkReleaseSnapshots(projectRoot: string): Violation[] {
  const snapshotViolations: Violation[] = [];
  const benchResultsDir = path.join(projectRoot, "bench", "results");
  if (!fs.existsSync(benchResultsDir)) return snapshotViolations;

  const ancestorCache = new Map<string, boolean>();
  const diffCache = new Map<string, string[] | null>();

  const isAncestorOfHead = (commit: string): boolean => {
    const cached = ancestorCache.get(commit);
    if (cached !== undefined) return cached;
    try {
      execFileSync("git", ["merge-base", "--is-ancestor", commit, "HEAD"], {
        cwd: projectRoot,
        stdio: "ignore",
      });
      ancestorCache.set(commit, true);
      return true;
    } catch {
      ancestorCache.set(commit, false);
      return false;
    }
  };

  const getChangedFilesSinceCommit = (commit: string): string[] | null => {
    if (diffCache.has(commit)) return diffCache.get(commit)!;
    try {
      const watchRoots = ["registry/items"];
      if (fs.existsSync(path.join(projectRoot, "packages", "runtime"))) {
        watchRoots.push("packages/runtime");
      }
      const out = execFileSync("git", ["diff", "--name-only", `${commit}^{commit}`, "--", ...watchRoots], {
        cwd: projectRoot,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      });
      const list = out
        .split(/\r?\n/)
        .map((l) => l.trim().replace(/\\/g, "/"))
        .filter(
          (f) =>
            /\.(tsx|ts|css)$/.test(f) &&
            !/(^|\/)demo\.tsx$/.test(f) &&
            !/\.(test|spec|fixture)\.[jt]sx?$/.test(f)
        );
      diffCache.set(commit, list);
      return list;
    } catch {
      diffCache.set(commit, null);
      return null;
    }
  };

  const entries = fs.readdirSync(benchResultsDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const itemName = entry.name;
    const itemBenchDir = path.join(benchResultsDir, itemName);
    const itemDir = path.join(projectRoot, "registry", "items", itemName);
    const files = fs.readdirSync(itemBenchDir).filter((f) => f.startsWith("release-") && f.endsWith(".json"));

    for (const file of files) {
      const fullPath = path.join(itemBenchDir, file);
      let parsed: Record<string, unknown> | null = null;
      try {
        parsed = JSON.parse(fs.readFileSync(fullPath, "utf8")) as Record<string, unknown>;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        snapshotViolations.push({
          file: fullPath,
          reason: `Invalid JSON in release snapshot: ${msg}`,
        });
        continue;
      }

      const measured = ((parsed?.measured as Record<string, unknown> | undefined) ?? parsed) as Record<string, unknown>;
      const commit = measured?.commit;
      if (!commit || typeof commit !== "string") {
        snapshotViolations.push({
          file: fullPath,
          reason: "Release snapshot is missing a valid string 'commit' field",
        });
        continue;
      }

      if (!isAncestorOfHead(commit)) {
        snapshotViolations.push({
          file: fullPath,
          reason: `Release snapshot commit '${commit}' is not an ancestor of HEAD`,
        });
        continue;
      }

      const allChanged = getChangedFilesSinceCommit(commit);
      if (allChanged === null) {
        snapshotViolations.push({
          file: fullPath,
          reason: `Failed to diff source files since '${commit}'`,
        });
      } else {
        const trackedPrefixes = getItemTrackedPaths(itemName, projectRoot).map((p) => `${p}/`);
        const changedSourceFiles = allChanged.filter((f) => trackedPrefixes.some((pref) => f.startsWith(pref)));
        if (changedSourceFiles.length > 0) {
          snapshotViolations.push({
            file: fullPath,
            reason: `Item source file(s) changed after release snapshot commit '${commit}': ${changedSourceFiles.join(", ")}`,
          });
        }
      }

      const integrityErrors = verifySnapshotIntegrity(itemName, itemDir, itemBenchDir, measured);
      for (const reason of integrityErrors) {
        snapshotViolations.push({
          file: fullPath,
          reason,
        });
      }
    }
  }

  return snapshotViolations;
}

export function runProvenanceCheck(): boolean {
  const projectRoot = process.cwd();
  violations.length = 0;
  scanDirectory(path.join(projectRoot, "packages"));
  scanDirectory(path.join(projectRoot, "registry"));
  scanDependencyLicenses(projectRoot);
  runJscpdCheck(projectRoot);
  violations.push(...checkReleaseSnapshots(projectRoot));

  if (violations.length > 0) {
    console.error(`\n❌ Provenance check failed with ${violations.length} violation(s):\n`);
    for (const v of violations) {
      const rel = path.relative(projectRoot, v.file);
      console.error(`  - ${rel}: ${v.reason}`);
    }
    return false;
  }

  console.log("✔ Provenance check passed: All source files have valid headers, compliant licenses, valid release snapshots, and 0 code clones.");
  return true;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const ok = runProvenanceCheck();
  process.exit(ok ? 0 : 1);
}
