// Original — Frictionborn Motion size measurement utility
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

export interface ItemSizeResult {
  itemName: string;
  initialBytes: number;
  initialGzipBytes: number;
  initialGzipKB: number;
  deferredBytes: number;
  deferredGzipBytes: number;
  deferredGzipKB: number;
  method: string;
}

function readNormalizedBuffer(filePath: string): Buffer {
  const text = fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n");
  return Buffer.from(text, "utf8");
}

export function measureItemSize(itemDir: string): ItemSizeResult {
  const itemName = path.basename(itemDir);

  // Initial code: <item>.tsx, <item>.module.css, <item>.css
  const mainTsx = path.join(itemDir, `${itemName}.tsx`);
  const mainCss = path.join(itemDir, `${itemName}.module.css`);
  const altCss = path.join(itemDir, `${itemName}.css`);

  const initialBuffers: Buffer[] = [];
  if (fs.existsSync(mainTsx)) initialBuffers.push(readNormalizedBuffer(mainTsx));
  if (fs.existsSync(mainCss)) initialBuffers.push(readNormalizedBuffer(mainCss));
  if (fs.existsSync(altCss)) initialBuffers.push(readNormalizedBuffer(altCss));

  const initialConcat = Buffer.concat(initialBuffers);
  const initialBytes = initialConcat.length;

  // Deferred code: <item>.gl.tsx, <item>.glsl.ts, shaders/
  const deferredBuffers: Buffer[] = [];
  const glTsx = path.join(itemDir, `${itemName}.gl.tsx`);
  const glslTs = path.join(itemDir, `${itemName}.glsl.ts`);
  const shadersDir = path.join(itemDir, "shaders");

  if (fs.existsSync(glTsx)) deferredBuffers.push(readNormalizedBuffer(glTsx));
  if (fs.existsSync(glslTs)) deferredBuffers.push(readNormalizedBuffer(glslTs));
  if (fs.existsSync(shadersDir)) {
    for (const f of fs.readdirSync(shadersDir).sort()) {
      deferredBuffers.push(readNormalizedBuffer(path.join(shadersDir, f)));
    }
  }

  const deferredConcat = Buffer.concat(deferredBuffers);
  const deferredBytes = deferredConcat.length;

  const initialGzipped = zlib.gzipSync(initialConcat, { level: 9 });
  const deferredGzipped = zlib.gzipSync(deferredConcat, { level: 9 });

  return {
    itemName,
    initialBytes,
    initialGzipBytes: initialGzipped.length,
    initialGzipKB: Number((initialGzipped.length / 1024).toFixed(2)),
    deferredBytes,
    deferredGzipBytes: deferredGzipped.length,
    deferredGzipKB: Number((deferredGzipped.length / 1024).toFixed(2)),
    method: "gzip-9",
  };
}
