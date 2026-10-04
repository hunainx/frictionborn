// Original — Frictionborn Motion asset preparation script
// Downloads 6 CC0 masterpieces from The Met Open Access collection,
// converts them to optimized WebP format (<= 200 KB each) for DistortionImage demos and stress test.
// Every object is checked against The Met Collection API first: it must be isPublicDomain, and the title and artist
// must match the row below. The image is downloaded from the API's own primaryImageSmall URL (the 600 px web-large
// rendition on images.metmuseum.org), never from a hand-copied link.

import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

interface ArtworkMeta {
  id: number;
  filename: string;
  title: string;
  artist: string;
  year: string;
  sourceUrl: string;
}

interface MetObject {
  objectID: number;
  isPublicDomain: boolean;
  title: string;
  artistDisplayName: string;
  objectURL: string;
  primaryImageSmall: string;
}

async function fetchVerifiedMetObject(art: ArtworkMeta): Promise<MetObject> {
  const resp = await fetch(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${art.id}`);
  if (!resp.ok) throw new Error(`Met API returned HTTP ${resp.status} for object ${art.id}`);
  const obj = (await resp.json()) as MetObject;
  if (obj.isPublicDomain !== true) throw new Error(`Met object ${art.id} (${obj.title}) is not isPublicDomain: refusing to use it`);
  if (!obj.title.toLowerCase().startsWith(art.title.toLowerCase())) throw new Error(`Met object ${art.id} is "${obj.title}", expected "${art.title}"`);
  if (obj.artistDisplayName !== art.artist) throw new Error(`Met object ${art.id} is by "${obj.artistDisplayName}", expected "${art.artist}"`);
  if (obj.objectURL !== art.sourceUrl) throw new Error(`Met object ${art.id} page is ${obj.objectURL}, expected ${art.sourceUrl}`);
  if (!obj.primaryImageSmall) throw new Error(`Met object ${art.id} has no image`);
  return obj;
}

const ARTWORKS: ArtworkMeta[] = [
  {
    id: 436535,
    filename: "art-1.webp",
    title: "Wheat Field with Cypresses",
    artist: "Vincent van Gogh",
    year: "1889",
    sourceUrl: "https://www.metmuseum.org/art/collection/search/436535",
  },
  {
    id: 436528,
    filename: "art-2.webp",
    title: "Irises",
    artist: "Vincent van Gogh",
    year: "1890",
    sourceUrl: "https://www.metmuseum.org/art/collection/search/436528",
  },
  {
    id: 437980,
    filename: "art-3.webp",
    title: "Cypresses",
    artist: "Vincent van Gogh",
    year: "1889",
    sourceUrl: "https://www.metmuseum.org/art/collection/search/437980",
  },
  {
    id: 45434,
    filename: "art-4.webp",
    title: "Under the Wave off Kanagawa",
    artist: "Katsushika Hokusai",
    year: "ca. 1830–32",
    sourceUrl: "https://www.metmuseum.org/art/collection/search/45434",
  },
  {
    id: 436524,
    filename: "art-5.webp",
    title: "Sunflowers",
    artist: "Vincent van Gogh",
    year: "1887",
    sourceUrl: "https://www.metmuseum.org/art/collection/search/436524",
  },
  {
    id: 437344,
    filename: "art-6.webp",
    title: "The Shepherd's Song",
    artist: "Pierre Puvis de Chavannes",
    year: "1891",
    sourceUrl: "https://www.metmuseum.org/art/collection/search/437344",
  },
];

async function main() {
  const root = process.cwd();
  const publicOut = path.join(root, "public", "assets", "distortion");
  const harnessOut = path.join(root, "bench", "harness", "public", "assets", "distortion");

  fs.mkdirSync(publicOut, { recursive: true });
  fs.mkdirSync(harnessOut, { recursive: true });

  console.log("==> Launching browser for WebP optimization...");
  const browser = await chromium.launch();
  const page = await browser.newPage();

  for (const art of ARTWORKS) {
    console.log(`Fetching artwork: ${art.title} (${art.artist})...`);
    const met = await fetchVerifiedMetObject(art);
    console.log(`  verified: object ${met.objectID} isPublicDomain=true, "${met.title.slice(0, 40)}", ${met.artistDisplayName}`);
    const resp = await fetch(met.primaryImageSmall, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
    });
    if (!resp.ok) {
      throw new Error(`Failed to fetch image for ${art.title}: HTTP ${resp.status}`);
    }

    const arrayBuffer = await resp.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const mime = resp.headers.get("content-type") || "image/jpeg";
    const srcDataUrl = `data:${mime};base64,${base64}`;

    await page.setContent(`<!doctype html><html><body><img id="raw-img" src="${srcDataUrl}" /></body></html>`);
    await page.waitForSelector("#raw-img");

    const webpDataUrl = await page.evaluate(async () => {
      const img = document.getElementById("raw-img") as HTMLImageElement;
      await img.decode();
      const maxDim = 800;
      const scale = Math.min(maxDim / img.naturalWidth, maxDim / img.naturalHeight, 1);
      const w = Math.round(img.naturalWidth * scale);
      const h = Math.round(img.naturalHeight * scale);

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);

      return canvas.toDataURL("image/webp", 0.85);
    });

    const webpBase64 = webpDataUrl.replace(/^data:image\/webp;base64,/, "");
    const webpBuffer = Buffer.from(webpBase64, "base64");
    const sizeKb = Math.round(webpBuffer.length / 1024);

    console.log(`  -> ${art.filename}: ${sizeKb} KB (<= 200 KB target)`);
    if (sizeKb > 200) {
      throw new Error(`Artwork ${art.filename} exceeds 200 KB limit: ${sizeKb} KB`);
    }

    const publicFilePath = path.join(publicOut, art.filename);
    const harnessFilePath = path.join(harnessOut, art.filename);

    fs.writeFileSync(publicFilePath, webpBuffer);
    fs.writeFileSync(harnessFilePath, webpBuffer);
  }

  await browser.close();
  console.log("✔ All 6 CC0 artworks fetched, converted to WebP, and verified <= 200 KB!");
}

main().catch((err) => {
  console.error("Failed to fetch demo assets:", err);
  process.exit(1);
});
