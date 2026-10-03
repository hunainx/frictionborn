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
    // 1. Setup minimal consumer project configuration
    const runtimeUrl = `file:${runtimePkgDir.replace(/\\/g, "/")}`;
    const packageJson = {
      name: "smoke-consumer",
      version: "1.0.0",
      private: true,
      type: "module",
      dependencies: {
        "@frictionborn/runtime": runtimeUrl,
        react: "^19.0.0",
        "react-dom": "^19.0.0",
      },
      devDependencies: {
        "@types/react": "^19.0.0",
        "@types/react-dom": "^19.0.0",
        typescript: "^5.0.0",
      },
    };

    fs.writeFileSync(
      path.join(tempDir, "package.json"),
      JSON.stringify(packageJson, null, 2),
      "utf8"
    );

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
    };

    fs.writeFileSync(
      path.join(tempDir, "components.json"),
      JSON.stringify(componentsJson, null, 2),
      "utf8"
    );

    // 2. Install base dependencies
    console.log("Installing consumer harness dependencies...");
    await runCommand("npm install --install-links", tempDir);

    // 3. Run shadcn add for each item
    for (const jsonFile of jsonFiles) {
      const itemName = jsonFile.replace(/\.json$/, "");
      const itemUrl = `http://127.0.0.1:${port}/r/${jsonFile}`;
      console.log(`==> Running 'shadcn add' for ${itemName} from ${itemUrl}`);

      const addCmd = `npx --yes shadcn@latest add ${itemUrl} -y -o -c "${tempDir}"`;
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

    // 4. Create smoke consumer file importing installed components
    const consumerSrc = `// Smoke consumer test
import { NoiseField } from "./components/ui/noise-field";
import { TextReveal } from "./components/ui/text-reveal";

export default function TestPage() {
  return (
    <div style={{ width: 800, height: 600 }}>
      <NoiseField colors={["#0D0F12", "#FB923C", "#3B82F6"]}>
        <TextReveal as="h1">Frictionborn Smoke Test OK</TextReveal>
      </NoiseField>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(tempDir, "smoke-consumer.tsx"), consumerSrc, "utf8");

    // 5. Run TypeScript compiler to ensure 0 compile/type errors
    console.log("==> Running TypeScript check on installed components...");
    await runCommand("npx tsc --noEmit", tempDir);
    console.log("✔ TypeScript verification passed with 0 errors!");
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
