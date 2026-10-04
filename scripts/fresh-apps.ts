// Original — Frictionborn Motion repeatable fresh-app verification script
// Scaffolds fresh Next 16 and Vite apps outside the repo, installs all public items via shadcn add,
// mounts them with default props, verifies 0 errors, pixel reads, idle main-thread < 10%, and captures screenshots.

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { exec, spawn, ChildProcess } from "node:child_process";
import { promisify } from "node:util";
import { chromium, type Page, type Browser } from "@playwright/test";
import { buildRegistry } from "./build-registry.ts";

const execAsync = promisify(exec);

async function runCommand(cmd: string, cwd: string): Promise<{ stdout: string; stderr: string }> {
  const isWin = process.platform === "win32";
  const shellCmd = isWin ? `cmd /c "${cmd}"` : cmd;
  return await execAsync(shellCmd, { cwd, encoding: "utf8" });
}

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

const SHADCN_OKLCH_CSS = `
@layer base {
  :root {
    --background: oklch(1 0 0);
    --foreground: oklch(0.145 0 0);
    --card: oklch(1 0 0);
    --card-foreground: oklch(0.145 0 0);
    --popover: oklch(1 0 0);
    --popover-foreground: oklch(0.145 0 0);
    --primary: oklch(0.205 0 0);
    --primary-foreground: oklch(0.985 0 0);
    --secondary: oklch(0.97 0 0);
    --secondary-foreground: oklch(0.205 0 0);
    --muted: oklch(0.97 0 0);
    --muted-foreground: oklch(0.556 0 0);
    --accent: oklch(0.97 0 0);
    --accent-foreground: oklch(0.205 0 0);
    --destructive: oklch(0.577 0.245 27.325);
    --destructive-foreground: oklch(0.577 0.245 27.325);
    --border: oklch(0.922 0 0);
    --input: oklch(0.922 0 0);
    --ring: oklch(0.708 0 0);
    --chart-1: oklch(0.646 0.222 41.116);
    --chart-2: oklch(0.6 0.118 184.704);
    --chart-3: oklch(0.398 0.07 227.392);
    --chart-4: oklch(0.828 0.189 84.429);
    --chart-5: oklch(0.769 0.188 70.08);
    --radius: 0.625rem;
  }
  .dark {
    --background: oklch(0.145 0 0);
    --foreground: oklch(0.985 0 0);
    --card: oklch(0.145 0 0);
    --card-foreground: oklch(0.985 0 0);
    --popover: oklch(0.145 0 0);
    --popover-foreground: oklch(0.985 0 0);
    --primary: oklch(0.985 0 0);
    --primary-foreground: oklch(0.205 0 0);
    --secondary: oklch(0.269 0 0);
    --secondary-foreground: oklch(0.985 0 0);
    --muted: oklch(0.269 0 0);
    --muted-foreground: oklch(0.708 0 0);
    --accent: oklch(0.269 0 0);
    --accent-foreground: oklch(0.985 0 0);
    --destructive: oklch(0.396 0.141 25.723);
    --destructive-foreground: oklch(0.637 0.237 25.331);
    --border: oklch(0.269 0 0);
    --input: oklch(0.269 0 0);
    --ring: oklch(0.439 0 0);
    --chart-1: oklch(0.488 0.243 264.376);
    --chart-2: oklch(0.696 0.17 162.48);
    --chart-3: oklch(0.769 0.188 70.08);
    --chart-4: oklch(0.627 0.265 303.9);
    --chart-5: oklch(0.645 0.246 16.439);
  }
}
body {
  background-color: var(--background);
  color: var(--foreground);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  margin: 0;
  padding: 0;
  min-height: 100vh;
}
`;

const UTILS_CODE = `
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`;

function generatePageComponent(installedItems: string[], isNext: boolean): string {
  const hasNoise = installedItems.includes("noise-field");
  const hasParticle = installedItems.includes("particle-field");
  const hasMesh = installedItems.includes("mesh-gradient");
  const hasText = installedItems.includes("text-reveal");
  const hasScroll = installedItems.includes("scroll-reveal");
  const hasMagnetic = installedItems.includes("magnetic-button");
  const hasMarquee = installedItems.includes("marquee");
  const hasSmooth = installedItems.includes("smooth-scroll");
  const hasSticky = installedItems.includes("sticky-scroll-story");
  const hasDistortion = installedItems.includes("distortion-image");

  const imports: string[] = [
    isNext ? '"use client";' : '',
    'import React from "react";',
  ];

  if (hasNoise) imports.push('import { NoiseField } from "@/components/ui/noise-field";');
  if (hasParticle) imports.push('import { ParticleField } from "@/components/ui/particle-field";');
  if (hasMesh) imports.push('import { MeshGradient } from "@/components/ui/mesh-gradient";');
  if (hasText) imports.push('import { TextReveal } from "@/components/ui/text-reveal";');
  if (hasScroll) imports.push('import { ScrollReveal } from "@/components/ui/scroll-reveal";');
  if (hasMagnetic) imports.push('import { MagneticButton } from "@/components/ui/magnetic-button";');
  if (hasMarquee) imports.push('import { Marquee } from "@/components/ui/marquee";');
  if (hasSmooth) imports.push('import { SmoothScroll } from "@/components/ui/smooth-scroll";');
  if (hasSticky) imports.push('import { StickyScrollStory } from "@/components/ui/sticky-scroll-story";');
  if (hasDistortion) imports.push('import { DistortionImage } from "@/components/ui/distortion-image";');

  return `${imports.filter(Boolean).join("\n")}

export default function FreshAppView() {
  const content = (
    <main style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 700, margin: 0 }}>
          Frictionborn Motion Fresh-App Suite
        </h1>
        <p style={{ color: "var(--muted-foreground, #64748b)", margin: "0.5rem 0 0 0" }}>
          Default props verified across shadcn oklch design tokens
        </p>
      </header>

      <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
        ${hasText ? `
        <div data-testid="item-text-reveal">
          <TextReveal as="h2" style={{ fontSize: "1.5rem", fontWeight: 600 }}>
            Precision Kinetic Primitives
          </TextReveal>
        </div>` : ''}

        ${hasMarquee ? `
        <div data-testid="item-marquee" style={{ overflow: "hidden" }}>
          <Marquee>
            <span style={{ padding: "0 1.5rem" }}>Aetheric Observatory</span>
            <span style={{ padding: "0 1.5rem" }}>Interferometric Telemetry</span>
            <span style={{ padding: "0 1.5rem" }}>Deterministic Motion</span>
          </Marquee>
        </div>` : ''}

        ${hasMagnetic ? `
        <div data-testid="item-magnetic-button">
          <MagneticButton>
            <button
              type="button"
              style={{
                minHeight: "44px",
                padding: "0 1.25rem",
                borderRadius: "6px",
                background: "var(--primary)",
                color: "var(--primary-foreground)",
                border: "none",
                cursor: "pointer",
                fontWeight: 500
              }}
            >
              Engage Trajectory
            </button>
          </MagneticButton>
        </div>` : ''}

        ${hasNoise ? `
        <div
          data-testid="gl-item-noise-field"
          style={{ width: "100%", height: "260px", borderRadius: "8px", overflow: "hidden", position: "relative" }}
        >
          <NoiseField style={{ width: "100%", height: "100%" }} />
        </div>` : ''}

        ${hasParticle ? `
        <div
          data-testid="gl-item-particle-field"
          style={{ width: "100%", height: "260px", borderRadius: "8px", overflow: "hidden", position: "relative" }}
        >
          <ParticleField style={{ width: "100%", height: "100%" }} />
        </div>` : ''}

        ${hasMesh ? `
        <div
          data-testid="gl-item-mesh-gradient"
          style={{ width: "100%", height: "260px", borderRadius: "8px", overflow: "hidden", position: "relative" }}
        >
          <MeshGradient style={{ width: "100%", height: "100%" }} />
        </div>` : ''}

        ${hasDistortion ? `
        <div
          data-testid="gl-item-distortion-image"
          style={{ width: "320px", height: "200px", borderRadius: "8px", overflow: "hidden", position: "relative" }}
        >
          <DistortionImage
            src="data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='200'%3E%3Crect width='320' height='200' fill='%233b82f6'/%3E%3C/svg%3E"
            alt="Distortion Test Image"
            width={320}
            height={200}
          />
        </div>` : ''}

        ${hasScroll ? `
        <div data-testid="item-scroll-reveal">
          <ScrollReveal>
            <div
              style={{
                padding: "1.5rem",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                background: "var(--card)",
                color: "var(--card-foreground)",
              }}
            >
              Scroll-Linked Dynamic Entrance Verified
            </div>
          </ScrollReveal>
        </div>` : ''}

        ${hasSticky ? `
        <div data-testid="item-sticky-scroll-story">
          <StickyScrollStory
            steps={[
              {
                id: "phase-1",
                title: "Laser Cooling",
                description: "Optical trap decelerates strontium beam to microkelvin temperatures.",
                media: { content: <div style={{ padding: "2rem" }}>Laser Cooling Array</div> },
              },
              {
                id: "phase-2",
                title: "Lattice Confinement",
                description: "Retroreflected beam creates standing wave optical dipole trap.",
                media: { content: <div style={{ padding: "2rem" }}>Lattice Confinement</div> },
              },
            ]}
          />
        </div>` : ''}
      </div>
    </main>
  );

  return ${hasSmooth ? '<SmoothScroll>{content}</SmoothScroll>' : 'content'};
}
`;
}

async function verifyPixels(page: Page, testId: string): Promise<number> {
  const item = page.locator(`[data-testid='${testId}']`);
  await item.scrollIntoViewIfNeeded();
  if (testId.includes("distortion")) {
    await item.hover();
  }
  await page.waitForTimeout(600);

  const canvas = item.locator("canvas");
  await canvas.waitFor({ state: "visible", timeout: 8000 });

  return await page.evaluate(async (tid) => {
    const el = document.querySelector(`[data-testid='${tid}']`);
    const c = el?.querySelector("canvas");
    if (!c || !c.width || !c.height) return 0;

    return await new Promise<number>((resolve) => {
      requestAnimationFrame(() => {
        try {
          const off = document.createElement("canvas");
          const size = 32;
          off.width = size;
          off.height = size;
          const ctx = off.getContext("2d");
          if (!ctx) return resolve(0);
          ctx.drawImage(c, 0, 0, size, size);
          const imgData = ctx.getImageData(0, 0, size, size).data;
          let nonZero = 0;
          for (let i = 0; i < imgData.length; i += 4) {
            const r = imgData[i];
            const g = imgData[i + 1];
            const b = imgData[i + 2];
            const a = imgData[i + 3];
            if (a > 0 && (r > 10 || g > 10 || b > 10)) {
              nonZero++;
            }
          }
          resolve(nonZero);
        } catch {
          resolve(0);
        }
      });
    });
  }, testId);
}

export async function runFreshAppsCheck(): Promise<void> {
  const root = process.cwd();
  console.log("==> Starting Fresh Apps Verification Suite...");

  // 1. Build registry and pack runtime
  console.log("==> Building shadcn registry and packing @frictionborn/runtime...");
  buildRegistry();
  await runCommand("pnpm --filter @frictionborn/runtime build", root);

  const tempRoot = path.join(os.tmpdir(), `fb-fresh-apps-${Date.now()}`);
  fs.mkdirSync(tempRoot, { recursive: true });
  console.log(`==> Temp workspace: ${tempRoot}`);

  await runCommand(`pnpm --filter @frictionborn/runtime pack --pack-destination "${tempRoot}"`, root);
  const tgzFile = fs.readdirSync(tempRoot).find((f) => f.endsWith(".tgz"));
  if (!tgzFile) {
    throw new Error("Failed to locate packed runtime tarball (.tgz)");
  }
  const runtimeTarballPath = path.join(tempRoot, tgzFile).replace(/\\/g, "/");
  console.log(`✔ Packed runtime tarball: ${runtimeTarballPath}`);

  // 2. Discover public items in /public/r
  const publicRDir = path.join(root, "public", "r");
  const jsonFiles = fs
    .readdirSync(publicRDir)
    .filter((f) => f.endsWith(".json") && f !== "index.json");
  const publicItems = jsonFiles.map((f) => f.replace(/\.json$/, ""));
  console.log(`Found ${publicItems.length} public item(s): ${publicItems.join(", ")}`);

  // 3. Start registry static server
  const port = 3197;
  const publicDir = path.join(root, "public");
  const registryServer = http.createServer((req, res) => {
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
    registryServer.listen(port, "127.0.0.1", () => resolve());
    registryServer.on("error", reject);
  });
  console.log(`✔ Static registry listening on http://127.0.0.1:${port}`);

  const runningProcesses: ChildProcess[] = [];
  const runningServers: http.Server[] = [registryServer];

  const today = formatDate(new Date());
  const screenshotsDir = path.join(root, "docs", "fresh-apps", today);
  fs.mkdirSync(screenshotsDir, { recursive: true });

  try {
    // ----------------------------------------------------
    // 4. Scaffold Fresh Next 16 App
    // ----------------------------------------------------
    console.log("\n==> [1/2] Scaffolding fresh Next 16 App...");
    const nextDir = path.join(tempRoot, "fresh-next");
    fs.mkdirSync(nextDir, { recursive: true });

    fs.writeFileSync(
      path.join(nextDir, "package.json"),
      JSON.stringify(
        {
          name: "fresh-next-app",
          version: "0.1.0",
          private: true,
          type: "module",
          dependencies: {
            "@frictionborn/runtime": `file:${runtimeTarballPath}`,
            clsx: "^2.1.1",
            next: "16.3.8",
            react: "19.3.0",
            "react-dom": "19.3.0",
            "tailwind-merge": "^3.0.2",
          },
          devDependencies: {
            "@types/node": "22.20.4",
            "@types/react": "19.3.0",
            "@types/react-dom": "19.3.0",
            typescript: "5.9.3",
          },
        },
        null,
        2
      )
    );

    fs.writeFileSync(path.join(nextDir, ".npmrc"), "node-linker=hoisted\nsave-exact=true\n");
    fs.writeFileSync(path.join(nextDir, "pnpm-workspace.yaml"), "allowBuilds:\n  esbuild: true\n  sharp: true\n");
    fs.writeFileSync(
      path.join(nextDir, "tsconfig.json"),
      JSON.stringify(
        {
          compilerOptions: {
            target: "ES2022",
            lib: ["dom", "dom.iterable", "esnext"],
            allowJs: true,
            skipLibCheck: true,
            strict: true,
            noEmit: true,
            esModuleInterop: true,
            module: "esnext",
            moduleResolution: "bundler",
            resolveJsonModule: true,
            isolatedModules: true,
            jsx: "react-jsx",
            incremental: true,
            plugins: [{ name: "next" }],
            paths: { "@/*": ["./*"] },
          },
          include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
          exclude: ["node_modules"],
        },
        null,
        2
      )
    );

    fs.writeFileSync(
      path.join(nextDir, "components.json"),
      JSON.stringify(
        {
          $schema: "https://ui.shadcn.com/schema.json",
          style: "default",
          rsc: true,
          tsx: true,
          tailwind: {
            config: "",
            css: "app/globals.css",
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
        },
        null,
        2
      )
    );

    fs.mkdirSync(path.join(nextDir, "lib"), { recursive: true });
    fs.writeFileSync(path.join(nextDir, "lib", "utils.ts"), UTILS_CODE);

    fs.mkdirSync(path.join(nextDir, "app"), { recursive: true });
    fs.writeFileSync(path.join(nextDir, "app", "globals.css"), SHADCN_OKLCH_CSS);
    fs.writeFileSync(
      path.join(nextDir, "app", "layout.tsx"),
      `import "./globals.css";
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`
    );

    console.log("Installing Next 16 dependencies via pnpm...");
    await runCommand("pnpm install", nextDir);

    console.log("Running shadcn add for each public item in Next 16...");
    for (const item of publicItems) {
      const itemUrl = `http://127.0.0.1:${port}/r/${item}.json`;
      console.log(`  - shadcn add ${item}`);
      await runCommand(`npx --yes shadcn@latest add ${itemUrl} -y -o -c "${nextDir}"`, nextDir);
    }

    fs.writeFileSync(
      path.join(nextDir, "app", "page.tsx"),
      generatePageComponent(publicItems, true)
    );

    console.log("Building Next 16 app (`next build`)...");
    await runCommand("npx next build", nextDir);
    console.log("✔ Next 16 build succeeded!");

    // Start Next 16 production server
    const nextPort = 3301;
    console.log(`Starting Next 16 server on port ${nextPort}...`);
    const isWin = process.platform === "win32";
    const startCmd = isWin ? `pnpm.cmd next start -p ${nextPort}` : `pnpm next start -p ${nextPort}`;
    const nextProc = spawn(startCmd, {
      cwd: nextDir,
      shell: true,
      stdio: "ignore",
    });
    runningProcesses.push(nextProc);

    // Wait for Next server to respond
    await waitForServer(`http://127.0.0.1:${nextPort}`);
    console.log(`✔ Next 16 server live at http://127.0.0.1:${nextPort}`);

    // ----------------------------------------------------
    // 5. Scaffold Fresh Vite React App
    // ----------------------------------------------------
    console.log("\n==> [2/2] Scaffolding fresh Vite React App...");
    const viteDir = path.join(tempRoot, "fresh-vite");
    fs.mkdirSync(viteDir, { recursive: true });

    fs.writeFileSync(
      path.join(viteDir, "package.json"),
      JSON.stringify(
        {
          name: "fresh-vite-app",
          private: true,
          version: "0.0.0",
          type: "module",
          dependencies: {
            "@frictionborn/runtime": `file:${runtimeTarballPath}`,
            clsx: "^2.1.1",
            react: "19.3.0",
            "react-dom": "19.3.0",
            "tailwind-merge": "^3.0.2",
          },
          devDependencies: {
            "@types/node": "22.20.4",
            "@types/react": "19.3.0",
            "@types/react-dom": "19.3.0",
            "@vitejs/plugin-react": "^4.3.4",
            typescript: "5.9.3",
            vite: "^6.2.0",
          },
        },
        null,
        2
      )
    );

    fs.writeFileSync(path.join(viteDir, ".npmrc"), "node-linker=hoisted\nsave-exact=true\n");
    fs.writeFileSync(path.join(viteDir, "pnpm-workspace.yaml"), "allowBuilds:\n  esbuild: true\n");
    fs.writeFileSync(
      path.join(viteDir, "vite.config.ts"),
      `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
`
    );

    fs.writeFileSync(
      path.join(viteDir, "tsconfig.json"),
      JSON.stringify(
        {
          compilerOptions: {
            target: "ES2022",
            useDefineForClassFields: true,
            lib: ["ES2022", "DOM", "DOM.Iterable"],
            module: "ESNext",
            skipLibCheck: true,
            moduleResolution: "bundler",
            allowImportingTsExtensions: false,
            resolveJsonModule: true,
            isolatedModules: true,
            noEmit: true,
            jsx: "react-jsx",
            strict: true,
            baseUrl: ".",
            paths: { "@/*": ["./src/*"] },
          },
          include: ["src"],
        },
        null,
        2
      )
    );

    fs.writeFileSync(
      path.join(viteDir, "components.json"),
      JSON.stringify(
        {
          $schema: "https://ui.shadcn.com/schema.json",
          style: "default",
          rsc: false,
          tsx: true,
          tailwind: {
            config: "",
            css: "src/index.css",
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
        },
        null,
        2
      )
    );

    fs.mkdirSync(path.join(viteDir, "src", "lib"), { recursive: true });
    fs.writeFileSync(path.join(viteDir, "src", "lib", "utils.ts"), UTILS_CODE);
    fs.writeFileSync(path.join(viteDir, "src", "index.css"), SHADCN_OKLCH_CSS);

    fs.writeFileSync(
      path.join(viteDir, "index.html"),
      `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Fresh Vite App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`
    );

    console.log("Installing Vite dependencies via pnpm...");
    await runCommand("pnpm install", viteDir);

    console.log("Running shadcn add for each public item in Vite...");
    for (const item of publicItems) {
      const itemUrl = `http://127.0.0.1:${port}/r/${item}.json`;
      console.log(`  - shadcn add ${item}`);
      await runCommand(`npx --yes shadcn@latest add ${itemUrl} -y -o -c "${viteDir}"`, viteDir);
    }

    fs.writeFileSync(
      path.join(viteDir, "src", "App.tsx"),
      generatePageComponent(publicItems, false)
    );

    fs.writeFileSync(
      path.join(viteDir, "src", "main.tsx"),
      `import React from 'react';
import ReactDOM from 'react-dom/client';
import { initMotionReady } from '@frictionborn/runtime';
import App from './App.tsx';
import './index.css';

initMotionReady();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`
    );

    console.log("Building Vite app (`vite build`)...");
    await runCommand("npx vite build", viteDir);
    console.log("✔ Vite build succeeded!");

    // Start static HTTP server for Vite dist
    const vitePort = 3302;
    const viteDistDir = path.join(viteDir, "dist");
    const viteServer = http.createServer((req, res) => {
      let rel = (req.url || "").split("?")[0].replace(/^\//, "");
      if (!rel || rel === "") rel = "index.html";
      let filePath = path.join(viteDistDir, rel);
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(viteDistDir, "index.html");
      }
      const ext = path.extname(filePath);
      const mimeTypes: Record<string, string> = {
        ".html": "text/html",
        ".js": "application/javascript",
        ".css": "text/css",
        ".svg": "image/svg+xml",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".webp": "image/webp",
      };
      const contentType = mimeTypes[ext] || "application/octet-stream";
      res.writeHead(200, { "Content-Type": contentType });
      res.end(fs.readFileSync(filePath));
    });

    await new Promise<void>((resolve, reject) => {
      viteServer.listen(vitePort, "127.0.0.1", () => resolve());
      viteServer.on("error", reject);
    });
    runningServers.push(viteServer);
    console.log(`✔ Vite server live at http://127.0.0.1:${vitePort}`);

    // ----------------------------------------------------
    // 6. Playwright Verification & Screenshots
    // ----------------------------------------------------
    console.log("\n==> [3/3] Running Playwright Verification across Next & Vite apps...");
    const browser: Browser = await chromium.launch({
      args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
    });

    const glItems = ["gl-item-noise-field", "gl-item-particle-field", "gl-item-mesh-gradient"];
    if (publicItems.includes("distortion-image")) {
      glItems.push("gl-item-distortion-image");
    }

    const apps = [
      { name: "next", url: `http://127.0.0.1:${nextPort}` },
      { name: "vite", url: `http://127.0.0.1:${vitePort}` },
    ];

    const modes = [
      { id: "light", mobile: false, dark: false, reduced: false },
      { id: "dark", mobile: false, dark: true, reduced: false },
      { id: "390", mobile: true, dark: false, reduced: false },
      { id: "reduced", mobile: false, dark: false, reduced: true },
    ];

    for (const app of apps) {
      console.log(`\n--> Testing Application: ${app.name.toUpperCase()} (${app.url})`);
      for (const mode of modes) {
        console.log(`  Testing mode: ${mode.id}...`);
        const context = await browser.newContext({
          viewport: mode.mobile
            ? { width: 390, height: 844 }
            : { width: 1440, height: 900 },
          deviceScaleFactor: mode.mobile ? 3 : 2,
          isMobile: mode.mobile,
          hasTouch: mode.mobile,
          colorScheme: mode.dark ? "dark" : "light",
          reducedMotion: mode.reduced ? "reduce" : "no-preference",
        });

        const page = await context.newPage();
        const consoleErrors: string[] = [];
        page.on("pageerror", (err) => consoleErrors.push(`[pageerror] ${err.message}`));
        page.on("console", (msg) => {
          if (msg.type() === "error") {
            consoleErrors.push(`[console.error] ${msg.text()}`);
          }
        });

        await page.goto(app.url, { waitUntil: "networkidle" });
        if (mode.dark) {
          await page.evaluate(() => document.documentElement.classList.add("dark"));
          await page.waitForTimeout(300);
        }

        // Assert 0 console/runtime errors
        if (consoleErrors.length > 0) {
          throw new Error(
            `[${app.name}][${mode.id}] Console errors encountered:\n${consoleErrors.join("\n")}`
          );
        }

        // Measure idle main-thread busy ratio over 2 seconds via CDP (Chromium)
        if (!mode.mobile) {
          const cdp = await context.newCDPSession(page);
          await cdp.send("Performance.enable");
          await page.waitForTimeout(1000); // Allow initial settle
          const m0 = Object.fromEntries(
            (await cdp.send("Performance.getMetrics")).metrics.map((x) => [x.name, x.value])
          );
          await page.waitForTimeout(2000);
          const m1 = Object.fromEntries(
            (await cdp.send("Performance.getMetrics")).metrics.map((x) => [x.name, x.value])
          );
          const taskDurationMs = (m1.TaskDuration - m0.TaskDuration) * 1000;
          const busyRatio = taskDurationMs / 2000;
          console.log(
            `    Main-thread busy: ${(busyRatio * 100).toFixed(2)}% (${Math.round(taskDurationMs)}ms / 2000ms)`
          );
          if (busyRatio >= 0.10) {
            throw new Error(
              `[${app.name}][${mode.id}] Idle main-thread busy ${(busyRatio * 100).toFixed(1)}% exceeds 10% ceiling`
            );
          }
        }

        // GL item assertions
        if (mode.reduced) {
          // Reduced motion: 0 active canvases, static posters visible
          const canvasCount = await page.locator("canvas").count();
          console.log(`    Reduced motion active canvases: ${canvasCount} (expected 0)`);
          if (canvasCount !== 0) {
            throw new Error(`[${app.name}][${mode.id}] Expected 0 active canvases in reduced motion, found ${canvasCount}`);
          }
        } else {
          // Normal mode: every GL item must show real pixels
          for (const glId of glItems) {
            if (mode.mobile && glId === "gl-item-distortion-image") {
              const imgCount = await page.locator(`[data-testid='${glId}'] img`).count();
              if (imgCount === 0) {
                throw new Error(`[${app.name}][${mode.id}] ${glId} missing plain img element!`);
              }
              console.log(`    ${glId}: verified plain image fallback on coarse mobile pointer (0 canvases)`);
              continue;
            }

            const nonZeroPixels = await verifyPixels(page, glId);
            console.log(`    ${glId}: ${nonZeroPixels} non-zero pixels sampled`);
            if (nonZeroPixels === 0) {
              throw new Error(`[${app.name}][${mode.id}] ${glId} canvas has 0 non-zero pixels (blank render)!`);
            }
          }
        }

        // Capture screenshot
        const screenshotFile = path.join(screenshotsDir, `${app.name}-${mode.id}.png`);
        await page.screenshot({ path: screenshotFile, fullPage: true });
        console.log(`    ✔ Screenshot saved: ${path.relative(root, screenshotFile)}`);

        await context.close();
      }
    }

    await browser.close();
    console.log("\n=======================================================");
    console.log("✔ ALL FRESH-APP CHECKS PASSED WITH 0 DEFECTS!");
    console.log(`✔ Screenshots saved to: ${path.relative(root, screenshotsDir)}`);
    console.log("=======================================================\n");
  } finally {
    console.log("Cleaning up servers and background processes...");
    for (const proc of runningProcesses) {
      try {
        proc.kill();
      } catch {}
    }
    for (const srv of runningServers) {
      try {
        srv.close();
      } catch {}
    }
    try {
      fs.rmSync(tempRoot, { recursive: true, force: true });
      console.log(`Cleaned up temp directory: ${tempRoot}`);
    } catch {}
  }
}

async function waitForServer(url: string, timeoutMs = 30000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      await new Promise<void>((resolve, reject) => {
        const req = http.get(url, (res) => {
          if (res.statusCode && res.statusCode < 500) resolve();
          else reject(new Error(`Status ${res.statusCode}`));
        });
        req.on("error", reject);
      });
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 400));
    }
  }
  throw new Error(`Server at ${url} failed to respond within ${timeoutMs}ms`);
}

// CLI execution
runFreshAppsCheck().catch((err) => {
  console.error("\n❌ Fresh-apps check failed:", err);
  process.exit(1);
});
