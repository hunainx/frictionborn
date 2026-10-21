// Original — audit M4: the spec sheets and registry metadata that agents read must match the code.
// (1) every usage example in meta.declared.json compiles against the real item sources;
// (2) every prop an item declares in its own source file is documented, and every documented prop exists in the code.
// Both were wrong for 5+ items after the API unification and nothing noticed.
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import ts from "typescript";

const root = path.resolve(__dirname, "..");
const itemsDir = path.join(root, "registry", "items");
const items = fs
  .readdirSync(itemsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name !== "dummy")
  .map((d) => d.name);

const pascal = (n: string) => n.replace(/(^|-)(\w)/g, (_, __, c: string) => c.toUpperCase());

function compilerOptions(): ts.CompilerOptions {
  const cfg = JSON.parse(fs.readFileSync(path.join(root, "tsconfig.json"), "utf8"));
  const paths: Record<string, string[]> = {};
  for (const [k, v] of Object.entries<string[]>(cfg.compilerOptions.paths)) paths[k] = v.map((x) => path.join(root, x));
  paths["react"] = [path.join(root, "node_modules/@types/react/index.d.ts")];
  paths["react/jsx-runtime"] = [path.join(root, "node_modules/@types/react/jsx-runtime.d.ts")];
  paths["*"] = [path.join(root, "node_modules", "*"), path.join(root, "node_modules", "@types", "*")];
  return {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    lib: ["lib.dom.d.ts", "lib.es2022.d.ts"],
    strict: true,
    esModuleInterop: true,
    skipLibCheck: true,
    jsx: ts.JsxEmit.ReactJSX,
    noEmit: true,
    baseUrl: root,
    paths,
    types: [],
  };
}

const declared = (item: string) => JSON.parse(fs.readFileSync(path.join(itemsDir, item, "meta.declared.json"), "utf8"));

const usageDir = fs.mkdtempSync(path.join(os.tmpdir(), "fb-usage-"));
const usageFiles = items.map((item) => {
  const f = path.join(usageDir, `${item}.usage.tsx`);
  fs.writeFileSync(f, declared(item).agent.usage);
  return f;
});
const itemSourceFiles = items.map((i) => path.join(itemsDir, i, `${i}.tsx`));
const program = ts.createProgram([...usageFiles, ...itemSourceFiles], compilerOptions());
const checker = program.getTypeChecker();

describe("spec sheet usage examples compile against the real components", () => {
  it("every agent.usage snippet type-checks", () => {
    expect(usageFiles.length).toBe(items.length);
    const problems: string[] = [];
    for (const f of usageFiles) {
      const sf = program.getSourceFile(f);
      expect(sf).toBeDefined();
      for (const d of ts.getPreEmitDiagnostics(program, sf)) {
        if (!d.file) continue;
        const { line } = d.file.getLineAndCharacterOfPosition(d.start ?? 0);
        problems.push(`${path.basename(d.file.fileName)}:${line + 1} TS${d.code} ${ts.flattenDiagnosticMessageText(d.messageText, "\n").split("\n")[0]}`);
      }
    }
    expect(problems).toEqual([]);
  });
});

describe("documented props equal the props the code declares", () => {

  for (const item of items) {
    it(`${item}: every prop declared in the item's own source is documented, and every documented prop exists`, () => {
      const file = path.join(itemsDir, item, `${item}.tsx`);
      const sf = program.getSourceFile(file)!;
      const moduleSym = checker.getSymbolAtLocation(sf)!;
      const exp = checker.getExportsOfModule(moduleSym).find((s) => s.name === pascal(item));
      expect(exp, `${pascal(item)} is exported`).toBeTruthy();
      const type = checker.getTypeOfSymbolAtLocation(exp!, sf);
      const sig = type.getCallSignatures()[0];
      expect(sig, "component has a call signature").toBeTruthy();
      const propsType = checker.getTypeOfSymbolAtLocation(sig.getParameters()[0], sf);
      const all = checker.getPropertiesOfType(propsType);
      const own = all.filter((p) => (p.declarations ?? []).some((d) => path.resolve(d.getSourceFile().fileName) === path.resolve(file)));
      const documented = new Set<string>(declared(item).props.map((p: { name: string }) => p.name));
      const allNames = new Set(all.map((p) => p.name));
      const undocumented = own.map((p) => p.name).filter((n) => !documented.has(n));
      const phantom = [...documented].filter((n) => !allNames.has(n));
      expect({ item, undocumented, phantom }).toEqual({ item, undocumented: [], phantom: [] });
    });
  }
});
