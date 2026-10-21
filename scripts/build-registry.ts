// Original — Frictionborn Motion shadcn registry builder
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { REPO_URL } from "./config.ts";

interface FileEntry {
  path: string;
  content: string;
  type: string;
  target: string;
}

interface RegistryItem {
  $schema: string;
  name: string;
  type: string;
  title: string;
  description: string;
  dependencies: string[];
  devDependencies: string[];
  registryDependencies: string[];
  files: FileEntry[];
  meta?: Record<string, any>;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function toTitle(kebab: string): string {
  return kebab.split("-").map(capitalize).join("");
}

/** A registry file target: relative, normalised, no dot segments, no backslash or drive letter, inside components/ui/. */
export function isSafeRegistryTarget(target: string): boolean {
  return /^components\/ui\/([A-Za-z0-9][A-Za-z0-9._-]*\/)*[A-Za-z0-9][A-Za-z0-9._-]*\.(tsx|ts)$/.test(target) && path.posix.normalize(target) === target;
}

/** npm packages an item may ask the consumer to install: exact versions only, and only what AGENTS.md allows. */
const ALLOWED_NPM = new Set(["lenis"]);

export function validateItemDependencies(itemName: string, meta: any): void {
  for (const dep of meta.dependencies?.npm ?? []) {
    const name = typeof dep === "string" ? dep.replace(/@[^@]*$/, "") : dep.name;
    const version = typeof dep === "string" ? dep.slice(name.length + 1) : dep.version;
    if (!ALLOWED_NPM.has(name)) throw new Error(`Registry item "${itemName}" depends on npm package "${name}", which is not on the allowlist (AGENTS.md).`);
    if (!/^\d+\.\d+\.\d+$/.test(version ?? "")) throw new Error(`Registry item "${itemName}": npm dependency ${name} must be pinned to an exact version, got "${version}".`);
  }
  for (const dep of meta.dependencies?.registry ?? []) {
    if (!/^@frictionborn\/[a-z0-9-]+$/.test(dep)) throw new Error(`Registry item "${itemName}": registry dependency "${dep}" must be a @frictionborn/<item> reference (no URLs).`);
  }
}

export function buildRegistry(): void {
  const root = process.cwd();
  const itemsDir = path.join(root, "registry", "items");
  const publicDir = path.join(root, "public");
  const publicRDir = path.join(publicDir, "r");

  fs.mkdirSync(publicRDir, { recursive: true });

  const registryItems: RegistryItem[] = [];

  if (!fs.existsSync(itemsDir)) {
    console.warn(`No items directory found at ${itemsDir}`);
    return;
  }

  const entries = fs.readdirSync(itemsDir, { withFileTypes: true });

  for (const ent of entries) {
    if (!ent.isDirectory()) continue;
    const itemName = ent.name;
    const itemDir = path.join(itemsDir, itemName);

    const declaredPath = path.join(itemDir, "meta.declared.json");
    const metaPath = path.join(itemDir, "meta.json");

    if (!fs.existsSync(declaredPath) && !fs.existsSync(metaPath)) {
      continue;
    }

    const rawMeta = fs.readFileSync(
      fs.existsSync(metaPath) ? metaPath : declaredPath,
      "utf8"
    );
    const meta = JSON.parse(rawMeta);

    // Skip internal fixtures like dummy (Hard Rule 3 & M1 follow-up)
    if (meta.fixture === true) {
      continue;
    }

    validateItemDependencies(itemName, meta);

    const files: FileEntry[] = [];

    // Helper to recursively collect distribution files (excluding demo and metadata)
    function collectFiles(dir: string, baseSubDir = "") {
      const dirEntries = fs.readdirSync(dir, { withFileTypes: true });
      for (const de of dirEntries) {
        if (de.isDirectory()) {
          collectFiles(path.join(dir, de.name), path.join(baseSubDir, de.name));
        } else {
          const filename = de.name;
          if (
            filename === "demo.tsx" ||
            filename === "meta.declared.json" ||
            filename === "meta.json" ||
            filename.endsWith(".test.ts") ||
            filename.endsWith(".test.tsx")
          ) {
            continue;
          }

          // Only plain, visibly named source files are distributable: a stray .env, README, image, or a symlink to
          // something outside the item must fail the build instead of being published.
          if (de.isSymbolicLink() || !de.isFile()) {
            throw new Error(`Registry item "${itemName}" contains a symlink or special file: ${filename}`);
          }
          if (!/^[A-Za-z0-9][A-Za-z0-9._-]*\.(tsx|ts)$/.test(filename)) {
            throw new Error(`Registry item "${itemName}" contains a file that is not a .ts/.tsx source: ${filename}`);
          }

          const fullPath = path.join(dir, filename);
          const relPath = path.relative(root, fullPath).replace(/\\/g, "/");
          // Normalise line endings so output is identical on Windows (autocrlf) and Linux CI
          const content = fs.readFileSync(fullPath, "utf8").replace(/\r\n/g, "\n");

          const targetSub = baseSubDir ? baseSubDir.replace(/\\/g, "/") + "/" : "";
          const target = `components/ui/${targetSub}${filename}`;

          // Finding 19: Validate that target stays strictly inside components/ui/
          if (!isSafeRegistryTarget(target)) {
            throw new Error(`Invalid registry file target: ${target} must stay inside components/ui/`);
          }

          const itemType = meta.item.kind === "composition" ? "registry:block" : "registry:ui";
          files.push({
            path: relPath,
            content,
            type: itemType,
            target,
          });
        }
      }
    }

    collectFiles(itemDir);

    const dependencies = ["@frictionborn/runtime"];
    if (Array.isArray(meta.dependencies?.npm)) {
      for (const dep of meta.dependencies.npm) {
        const depStr = typeof dep === "string" ? dep : `${dep.name}@${dep.version}`;
        if (!dependencies.includes(depStr)) {
          dependencies.push(depStr);
        }
      }
    }

    const itemType = meta.item.kind === "composition" ? "registry:block" : "registry:ui";
    const item: RegistryItem = {
      $schema: "https://ui.shadcn.com/schema/registry-item.json",
      name: meta.item.name,
      type: itemType,
      title: toTitle(meta.item.name),
      description: meta.item.summary || "",
      dependencies,
      devDependencies: [],
      registryDependencies: meta.dependencies?.registry || [],
      files,
      meta,
    };

    registryItems.push(item);

    // Write individual item JSON to public/r/<item>.json
    const outJson = JSON.stringify(item, null, 2) + "\n";
    const itemOutPath = path.join(publicRDir, `${itemName}.json`);
    fs.writeFileSync(itemOutPath, outJson, "utf8");

    // Copy spec sheet markdown if exists to public/r/<item>.md
    const specSheetPath = path.join(
      root,
      "skills",
      "frictionborn",
      "references",
      "items",
      `${itemName}.md`
    );
    if (fs.existsSync(specSheetPath)) {
      const specContent = fs.readFileSync(specSheetPath, "utf8");
      fs.writeFileSync(path.join(publicRDir, `${itemName}.md`), specContent, "utf8");
    }

    console.log(`✔ Built registry item: /r/${itemName}.json (${files.length} files)`);
  }

  // Write top-level registry.json and public/r/index.json
  const registryIndex = {
    $schema: "https://ui.shadcn.com/schema/registry.json",
    name: "frictionborn",
    homepage: REPO_URL,
    items: registryItems,
  };

  const registryIndexJson = JSON.stringify(registryIndex, null, 2) + "\n";
  fs.writeFileSync(path.join(publicDir, "registry.json"), registryIndexJson, "utf8");
  fs.writeFileSync(path.join(publicRDir, "index.json"), registryIndexJson, "utf8");

  // Copy llms.txt to public/ and public/r/
  const llmsPath = path.join(root, "llms.txt");
  if (fs.existsSync(llmsPath)) {
    const llmsContent = fs.readFileSync(llmsPath, "utf8");
    fs.writeFileSync(path.join(publicDir, "llms.txt"), llmsContent, "utf8");
    fs.writeFileSync(path.join(publicRDir, "llms.txt"), llmsContent, "utf8");
  }

  // Sync to the-private-website-repo/public if the-private-website-repo exists
  const docsPublicDir = path.join(root, "apps", "docs", "public");
  if (fs.existsSync(path.join(root, "apps", "docs"))) {
    fs.mkdirSync(path.join(docsPublicDir, "r"), { recursive: true });
    fs.cpSync(publicRDir, path.join(docsPublicDir, "r"), { recursive: true });
    fs.copyFileSync(path.join(publicDir, "registry.json"), path.join(docsPublicDir, "registry.json"));
    if (fs.existsSync(llmsPath)) {
      fs.copyFileSync(llmsPath, path.join(docsPublicDir, "llms.txt"));
    }
    // The docs previews load demo images from /assets (DistortionImage); without them the docs site 404s on the images.
    // oversized.webp is a bench fixture, not a demo asset.
    const assetsDir = path.join(publicDir, "assets");
    if (fs.existsSync(assetsDir)) {
      fs.cpSync(assetsDir, path.join(docsPublicDir, "assets"), {
        recursive: true,
        filter: (src) => !src.endsWith("oversized.webp"),
      });
    }
    console.log(`✔ Synced registry, llms.txt and demo assets to the-private-website-repo/public for docs site deployment.`);
  }

  console.log(`✔ Registry build complete: ${registryItems.length} public items published.`);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  buildRegistry();
}
