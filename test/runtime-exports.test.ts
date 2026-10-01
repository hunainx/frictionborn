// Original — Frictionborn Motion runtime package.json exports contract
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const pkg = JSON.parse(fs.readFileSync(path.resolve("packages/runtime/package.json"), "utf8"));

describe("@frictionborn/runtime exports", () => {
  it("every entry has a `default` condition so plain Vite/Node resolvers can resolve it", () => {
    for (const [entry, conditions] of Object.entries<Record<string, string>>(pkg.exports)) {
      expect(conditions.default, `exports["${entry}"].default`).toBeTruthy();
    }
  });

  it("the react-server entry is the hook-free server build; default is the client build", () => {
    expect(pkg.exports["."]["react-server"]).toBe("./dist/server.mjs");
    expect(pkg.exports["."].default).toBe("./dist/index.mjs");
  });
});
