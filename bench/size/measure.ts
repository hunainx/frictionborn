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

export function measureItemSize(itemDir: string): ItemSizeResult {
  const itemName = path.basename(itemDir);
  let initialBytes = 0;
  let deferredBytes = 0;

  // Initial code: <item>.tsx, <item>.module.css
  const mainTsx = path.join(itemDir, `${itemName}.tsx`);
  const mainCss = path.join(itemDir, `${itemName}.module.css`);

  if (fs.existsSync(mainTsx)) {
    initialBytes += fs.readFileSync(mainTsx).length;
  }
  if (fs.existsSync(mainCss)) {
    initialBytes += fs.readFileSync(mainCss).length;
  }

  // Deferred code: <item>.gl.tsx, shaders/
  const glTsx = path.join(itemDir, `${itemName}.gl.tsx`);
  const shadersDir = path.join(itemDir, "shaders");

  if (fs.existsSync(glTsx)) {
    deferredBytes += fs.readFileSync(glTsx).length;
  }
  if (fs.existsSync(shadersDir)) {
    for (const f of fs.readdirSync(shadersDir)) {
      deferredBytes += fs.readFileSync(path.join(shadersDir, f)).length;
    }
  }

  const initialGzipped = zlib.gzipSync(
    fs.existsSync(mainTsx) ? fs.readFileSync(mainTsx) : Buffer.alloc(0),
    { level: 9 }
  );
  const deferredGzipped = zlib.gzipSync(
    fs.existsSync(glTsx) ? fs.readFileSync(glTsx) : Buffer.alloc(0),
    { level: 9 }
  );

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
