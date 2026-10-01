// Original — Frictionborn Motion shadcn registry builder
import fs from "node:fs";
import path from "node:path";

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
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function toTitle(kebab: string): string {
  return kebab.split("-").map(capitalize).join("");
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

          const fullPath = path.join(dir, filename);
          const relPath = path.relative(root, fullPath).replace(/\\/g, "/");
          // Normalise line endings so output is identical on Windows (autocrlf) and Linux CI
          const content = fs.readFileSync(fullPath, "utf8").replace(/\r\n/g, "\n");

          const targetSub = baseSubDir ? baseSubDir.replace(/\\/g, "/") + "/" : "";
          const target = `components/ui/${targetSub}${filename}`;

          files.push({
            path: relPath,
            content,
            type: "registry:ui",
            target,
          });
        }
      }
    }

    collectFiles(itemDir);

    const dependencies = ["@frictionborn/runtime"];
    if (Array.isArray(meta.dependencies?.npm)) {
      for (const dep of meta.dependencies.npm) {
        if (!dependencies.includes(dep)) {
          dependencies.push(dep);
        }
      }
    }

    const item: RegistryItem = {
      $schema: "https://ui.shadcn.com/schema/registry-item.json",
      name: meta.item.name,
      type: "registry:ui",
      title: toTitle(meta.item.name),
      description: meta.item.summary || "",
      dependencies,
      devDependencies: [],
      registryDependencies: meta.dependencies?.registry || [],
      files,
    };

    registryItems.push(item);

    // Write individual item JSON to public/r/<item>.json
    const outJson = JSON.stringify(item, null, 2) + "\n";
    const itemOutPath = path.join(publicRDir, `${itemName}.json`);
    fs.writeFileSync(itemOutPath, outJson, "utf8");

    // Copy spec sheet markdown if exists to public/r/<item>.md
    const specSheetPath = path.join(
      root,
      "agents",
      "skill",
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
    homepage: "https://github.com/hunainx/frictionborn",
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

  console.log(`✔ Registry build complete: ${registryItems.length} public items published.`);
}

buildRegistry();
