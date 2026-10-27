// Original — Frictionborn Motion: the bench's demo images, drawn at test time instead of committed.
// The public repository ships no media (no images, fonts or models), but the DistortionImage specs need real pictures: the harness
// serves /assets/distortion/*.webp and a spec reads public/assets/distortion/art-1.webp. Chromium draws each picture on a canvas from
// a fixed seed (same pixels on every run, varied enough that "the framebuffer is not blank or flat" means something) and encodes it
// as WebP. Files that already exist are left alone, so a checkout that has the originals keeps them.
import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

export interface DemoImage {
  name: string;
  width: number;
  height: number;
  seed: number;
}

/** Same names and sizes as the original artwork, so srcset widths and the 3000x2000 texture-budget case keep their meaning. */
export const DEMO_IMAGES: readonly DemoImage[] = [
  { name: "art-1.webp", width: 599, height: 477, seed: 11 },
  { name: "art-2.webp", width: 599, height: 475, seed: 23 },
  { name: "art-3.webp", width: 495, height: 624, seed: 37 },
  { name: "art-4.webp", width: 600, height: 403, seed: 41 },
  { name: "art-5.webp", width: 599, height: 423, seed: 59 },
  { name: "art-6.webp", width: 600, height: 575, seed: 67 },
  { name: "oversized.webp", width: 3000, height: 2000, seed: 73 },
];

/** Where the bench reads them: the harness's static files, and the repo-level copy a spec reads from disk. */
export function demoImageDirs(root: string): string[] {
  return [path.join(root, "bench", "harness", "public", "assets", "distortion"), path.join(root, "public", "assets", "distortion")];
}

/** Writes every missing demo image into every directory; returns the paths it wrote. */
export async function ensureDemoImages(root: string): Promise<string[]> {
  const dirs = demoImageDirs(root);
  const missing = DEMO_IMAGES.filter((img) => dirs.some((d) => !fs.existsSync(path.join(d, img.name))));
  if (missing.length === 0) return [];

  const browser = await chromium.launch();
  const written: string[] = [];
  try {
    const page = await browser.newPage();
    for (const img of missing) {
      const dataUrl = await page.evaluate(({ width, height, seed }) => {
        // mulberry32: a small seeded generator, so a run draws the same picture every time
        let s = seed >>> 0;
        const rand = () => {
          s = (s + 0x6d2b79f5) >>> 0;
          let t = s;
          t = Math.imul(t ^ (t >>> 15), t | 1);
          t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
          return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        const hue = Math.floor(rand() * 360);
        const sky = ctx.createLinearGradient(0, 0, 0, height);
        sky.addColorStop(0, `hsl(${hue} 60% 72%)`);
        sky.addColorStop(0.55, `hsl(${(hue + 40) % 360} 55% 52%)`);
        sky.addColorStop(1, `hsl(${(hue + 200) % 360} 45% 22%)`);
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, width, height);
        // soft blobs and brush-like strokes: colour and edges everywhere, like a painting
        for (let i = 0; i < 28; i++) {
          const x = rand() * width;
          const y = rand() * height;
          const r = (0.05 + rand() * 0.22) * Math.max(width, height);
          const g = ctx.createRadialGradient(x, y, 0, x, y, r);
          g.addColorStop(0, `hsla(${(hue + rand() * 160) % 360} 70% ${35 + rand() * 40}% / 0.55)`);
          g.addColorStop(1, "hsla(0 0% 0% / 0)");
          ctx.fillStyle = g;
          ctx.fillRect(x - r, y - r, r * 2, r * 2);
        }
        ctx.lineCap = "round";
        for (let i = 0; i < 140; i++) {
          ctx.strokeStyle = `hsla(${(hue + rand() * 220) % 360} 65% ${25 + rand() * 55}% / ${0.25 + rand() * 0.5})`;
          ctx.lineWidth = (0.004 + rand() * 0.018) * width;
          const x = rand() * width;
          const y = rand() * height;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.quadraticCurveTo(x + (rand() - 0.5) * width * 0.3, y + (rand() - 0.5) * height * 0.3, x + (rand() - 0.5) * width * 0.4, y + (rand() - 0.5) * height * 0.2);
          ctx.stroke();
        }
        return canvas.toDataURL("image/webp", 0.82);
      }, img);
      if (!dataUrl.startsWith("data:image/webp;base64,")) throw new Error(`Chromium did not encode ${img.name} as WebP`);
      const bytes = Buffer.from(dataUrl.slice("data:image/webp;base64,".length), "base64");
      for (const dir of dirs) {
        const file = path.join(dir, img.name);
        if (fs.existsSync(file)) continue;
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(file, bytes);
        written.push(file);
      }
    }
  } finally {
    await browser.close();
  }
  return written;
}
