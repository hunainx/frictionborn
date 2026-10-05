// Original — Frictionborn Motion install smoke test
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { buildRegistry } from "./build-registry.ts";

const execAsync = promisify(exec);

async function runCommand(cmd: string, cwd: string): Promise<{ stdout: string; stderr: string }> {
  const isWin = process.platform === "win32";
  const shellCmd = isWin ? `cmd /c "${cmd}"` : cmd;
  return await execAsync(shellCmd, { cwd, encoding: "utf8" });
}

export async function runSmokeTest(): Promise<void> {
  const root = process.cwd();
  console.log("==> Building shadcn registry for smoke test...");
  buildRegistry();

  const publicDir = path.join(root, "public");
  const publicRDir = path.join(publicDir, "r");
  const runtimePkgDir = path.join(root, "packages", "runtime");
  const itemsDir = path.join(root, "registry", "items");

  if (!fs.existsSync(publicRDir)) {
    throw new Error(`Registry output directory not found: ${publicRDir}`);
  }

  const jsonFiles = fs
    .readdirSync(publicRDir)
    .filter((f) => f.endsWith(".json") && f !== "index.json");

  if (jsonFiles.length === 0) {
    throw new Error("No registry items found to test.");
  }

  console.log(`Found ${jsonFiles.length} item(s) to smoke test: ${jsonFiles.join(", ")}`);

  // Start static HTTP server serving /public
  const port = 3198;
  const server = http.createServer((req, res) => {
    const relPath = (req.url || "").split("?")[0].replace(/^\//, "");
    const filePath = path.join(publicDir, relPath);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const content = fs.readFileSync(filePath);
      res.writeHead(200, {
        "Content-Type": filePath.endsWith(".json") ? "application/json" : "text/plain",
        "Content-Length": content.length,
        "Access-Control-Allow-Origin": "*",
      });
      res.end(content);
    } else {
      res.writeHead(404);
      res.end("Not found");
    }
  });

  await new Promise<void>((resolve, reject) => {
    server.listen(port, "127.0.0.1", () => resolve());
    server.on("error", reject);
  });

  console.log(`Registry static server listening on http://127.0.0.1:${port}`);

  const tempDir = path.join(os.tmpdir(), `fb-smoke-${Date.now()}`);
  fs.mkdirSync(tempDir, { recursive: true });
  console.log(`Created smoke test harness directory: ${tempDir}`);

  try {
    // 1. Setup minimal consumer project configuration with exact pins (Audit Finding N17)
    const runtimeUrl = `file:${runtimePkgDir.replace(/\\/g, "/")}`;
    const packageJson = {
      name: "smoke-consumer",
      version: "1.0.0",
      private: true,
      type: "module",
      dependencies: {
        "@frictionborn/runtime": runtimeUrl,
        react: "19.3.0",
        "react-dom": "19.3.0",
      },
      devDependencies: {
        "@types/react": "19.3.0",
        "@types/react-dom": "19.3.0",
        typescript: "5.9.3",
        eslint: "9.39.5",
        "@eslint/js": "9.39.5",
        "typescript-eslint": "8.57.1",
      },
    };

    fs.writeFileSync(
      path.join(tempDir, "package.json"),
      JSON.stringify(packageJson, null, 2),
      "utf8"
    );

    // Enforce exact save in npm for installed registry dependencies (Audit N17)
    fs.writeFileSync(path.join(tempDir, ".npmrc"), "save-exact=true\n", "utf8");

    const eslintConfig = `import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  }
);
`;
    fs.writeFileSync(path.join(tempDir, "eslint.config.js"), eslintConfig, "utf8");

    const tsConfig = {
      compilerOptions: {
        target: "ES2022",
        module: "ESNext",
        moduleResolution: "bundler",
        jsx: "react-jsx",
        strict: true,
        noUnusedLocals: true,
        noUnusedParameters: true,
        skipLibCheck: true,
        baseUrl: ".",
        paths: {
          "@/*": ["./*"],
        },
      },
    };

    fs.writeFileSync(
      path.join(tempDir, "tsconfig.json"),
      JSON.stringify(tsConfig, null, 2),
      "utf8"
    );

    const componentsJson = {
      $schema: "https://ui.shadcn.com/schema.json",
      style: "default",
      rsc: true,
      tsx: true,
      tailwind: {
        config: "",
        css: "",
        baseColor: "neutral",
        cssVariables: true,
      },
      aliases: {
        components: "@/components",
        utils: "@/lib/utils",
        ui: "@/components/ui",
        lib: "@/lib",
        hooks: "@/hooks",
      },
      registries: {
        "@frictionborn": `http://127.0.0.1:${port}/r/{name}.json`,
      },
    };

    fs.writeFileSync(
      path.join(tempDir, "components.json"),
      JSON.stringify(componentsJson, null, 2),
      "utf8"
    );

    // 2. Install base dependencies
    console.log("Installing consumer harness dependencies...");
    await runCommand("npm install --install-links", tempDir);

    // Sort items so primitive dependencies are installed before compositions that depend on them
    const COMPOSITIONS = ["ambient-hero", "scroll-showcase"];
    jsonFiles.sort((a, b) => {
      const aComp = COMPOSITIONS.some((c) => a.startsWith(c));
      const bComp = COMPOSITIONS.some((c) => b.startsWith(c));
      if (aComp === bComp) return a.localeCompare(b);
      return aComp ? 1 : -1;
    });

    // 3. Run shadcn add for each item
    for (const jsonFile of jsonFiles) {
      const itemName = jsonFile.replace(/\.json$/, "");
      const itemUrl = `http://127.0.0.1:${port}/r/${jsonFile}`;
      console.log(`==> Running 'shadcn add' for ${itemName} from ${itemUrl}`);

      const addCmd = `npx --yes shadcn@4.21.1 add ${itemUrl} -y -o -c "${tempDir}"`;
      const res = await runCommand(addCmd, tempDir);
      console.log(res.stdout);

      // Verify component file was written
      const expectedComponent = path.join(tempDir, "components", "ui", `${itemName}.tsx`);
      if (!fs.existsSync(expectedComponent)) {
        throw new Error(
          `Expected component file was not created: ${expectedComponent}`
        );
      }
      console.log(`✔ Successfully installed ${itemName} into consumer project.`);
    }

    // 4. Pins & Metadata: registry JSON must carry verified meta and exact pins
    for (const jsonFile of jsonFiles) {
      const item = JSON.parse(fs.readFileSync(path.join(publicRDir, jsonFile), "utf8"));
      const itemName = jsonFile.replace(/\.json$/, "");
      const metaPath = path.join(itemsDir, itemName, "meta.json");
      if (!item.meta) {
        throw new Error(`Registry item ${itemName}.json is missing 'meta' property (Decision 28)`);
      }
      if (fs.existsSync(metaPath)) {
        const expectedMeta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
        if (JSON.stringify(item.meta) !== JSON.stringify(expectedMeta)) {
          throw new Error(`Registry item ${itemName}.json 'meta' does not match meta.json`);
        }
      }
      for (const dep of (item.dependencies ?? []) as string[]) {
        if (dep.startsWith("@frictionborn/")) continue;
        if (!/@\d+\.\d+\.\d+$/.test(dep)) {
          throw new Error(`Registry item ${item.name} depends on "${dep}": must be pinned exactly (AGENTS rule 10)`);
        }
      }
    }
    console.log("✔ Every registry JSON carries verified meta and exact pins.");
    const consumerPkg = JSON.parse(
      fs.readFileSync(path.join(tempDir, "package.json"), "utf8")
    );
    for (const [depName, depVer] of Object.entries<string>(consumerPkg.dependencies || {})) {
      if (depName === "@frictionborn/runtime") continue;
      if (depVer.startsWith("^") || depVer.startsWith("~")) {
        console.warn(
          `⚠ Consumer package.json has "${depName}": "${depVer}" (default save prefix); the registry pin cannot enforce this. Tracked as audit finding N17.`
        );
      }
    }

    // 5. Create smoke consumer file importing installed components
    const consumerSrc = `// Smoke consumer test
import { NoiseField } from "./components/ui/noise-field";
import { TextReveal } from "./components/ui/text-reveal";
import { ScrollReveal } from "./components/ui/scroll-reveal";
import { MagneticButton } from "./components/ui/magnetic-button";
import { Marquee } from "./components/ui/marquee";
import { SmoothScroll } from "./components/ui/smooth-scroll";
import { StickyScrollStory } from "./components/ui/sticky-scroll-story";
import { ParticleField } from "./components/ui/particle-field";
import { MeshGradient } from "./components/ui/mesh-gradient";

export default function TestPage() {
  return (
    <SmoothScroll>
      <div style={{ width: 800, height: 600 }}>
        <NoiseField colors={["#0D0F12", "#FB923C", "#3B82F6"]}>
          <TextReveal as="h1">Frictionborn Smoke Test OK</TextReveal>
        </NoiseField>
        <ParticleField count={50} />
        <MeshGradient speed={0.2} />
        <ScrollReveal>
          <MagneticButton>
            <button type="button">Action</button>
          </MagneticButton>
        </ScrollReveal>
        <Marquee>
          <span>Token Alpha</span>
          <span>Token Beta</span>
        </Marquee>
        <StickyScrollStory
          steps={[
            { id: "1", title: "Step 1", description: "Desc 1", media: <div>Media 1</div> },
          ]}
        />
      </div>
    </SmoothScroll>
  );
}
`;
    fs.writeFileSync(path.join(tempDir, "smoke-consumer.tsx"), consumerSrc, "utf8");

    // 6. Run TypeScript compiler to ensure 0 compile/type errors
    console.log("==> Running TypeScript check on installed components...");
    await runCommand("npx tsc --noEmit", tempDir);
    console.log("✔ TypeScript verification passed with 0 errors!");

    // 7. Run ESLint to ensure installed components pass default lint rules
    console.log("==> Running ESLint check on installed components...");
    await runCommand("npx eslint components/ui", tempDir);
    console.log("✔ ESLint verification passed on installed components with 0 errors!");
  } finally {
    server.close();
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
      console.log(`Cleaned up temporary harness: ${tempDir}`);
    } catch {
      // Ignore cleanup failure
    }
  }

  console.log("==> ALL REGISTRY SMOKE TESTS PASSED SUCCESSFULLY! ✔");
}

runSmokeTest().catch((err) => {
  console.error("Registry smoke test failed:", err);
  process.exit(1);
});
