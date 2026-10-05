// Original — audit docs: the docs site prints `default` values from meta.declared.json, so a declared default
// must equal the default the component really uses. Parses each item's source with the TypeScript compiler API.
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const ROOT = path.resolve(__dirname, "..");
const ITEMS = path.join(ROOT, "registry", "items");

type Declared = { name: string; default?: unknown };

function literalValue(node: ts.Expression): string | number | boolean | null | undefined | "<expr>" {
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (ts.isStringLiteralLike(node)) return node.text;
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (node.kind === ts.SyntaxKind.NullKeyword) return null;
  if (ts.isIdentifier(node) && node.text === "undefined") return undefined;
  if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.MinusToken && ts.isNumericLiteral(node.operand)) {
    return -Number(node.operand.text);
  }
  return "<expr>";
}

/** Collects `name = <literal>` defaults from every destructuring pattern in an item's component files. */
export function collectCodeDefaults(source: string, file: string): Map<string, ReturnType<typeof literalValue>> {
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const out = new Map<string, ReturnType<typeof literalValue>>();
  const visit = (n: ts.Node) => {
    if (ts.isBindingElement(n) && ts.isObjectBindingPattern(n.parent) && n.initializer && !n.dotDotDotToken) {
      const name = ts.isIdentifier(n.propertyName ?? n.name) ? (n.propertyName ?? n.name).getText(sf) : null;
      if (name && !out.has(name)) out.set(name, literalValue(n.initializer));
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return out;
}

const items = fs
  .readdirSync(ITEMS, { withFileTypes: true })
  .filter((d) => d.isDirectory() && fs.existsSync(path.join(ITEMS, d.name, "meta.declared.json")) && d.name !== "dummy")
  .map((d) => d.name);

describe("declared prop defaults equal the defaults in the component source", () => {
  for (const item of items) {
    it(item, () => {
      const declared = JSON.parse(fs.readFileSync(path.join(ITEMS, item, "meta.declared.json"), "utf8"));
      const props: Declared[] = declared.props ?? [];
      const code = new Map<string, ReturnType<typeof literalValue>>();
      for (const f of fs.readdirSync(path.join(ITEMS, item))) {
        if (!/\.tsx$/.test(f) || /demo|\.test\./.test(f)) continue;
        const src = fs.readFileSync(path.join(ITEMS, item, f), "utf8");
        for (const [k, v] of collectCodeDefaults(src, f)) if (!code.has(k)) code.set(k, v);
      }
      const mismatches: string[] = [];
      let eligible = 0;
      let compared = 0;
      for (const p of props) {
        const d = p.default;
        if (d === null || d === undefined) continue;
        if (typeof d !== "number" && typeof d !== "string" && typeof d !== "boolean") continue;
        eligible++;
        if (!code.has(p.name)) continue; // default not expressed as a destructuring literal (e.g. a shared constant)
        const actual = code.get(p.name);
        if (actual === "<expr>") continue;
        compared++;
        if (actual !== d) mismatches.push(`${item}.${p.name}: declared ${JSON.stringify(d)}, code ${JSON.stringify(actual)}`);
      }
      expect(mismatches, mismatches.join("\n")).toEqual([]);
      // non-vacuity: at least half of the primitive defaults must really have been compared
      expect(compared, `${item}: compared ${compared} of ${eligible}`).toBeGreaterThanOrEqual(Math.ceil(eligible / 2));
    });
  }

  it("collectCodeDefaults reads destructured literal defaults", () => {
    const m = collectCodeDefaults("export function A({ a = 40, b = 'x', c = true, d, ...rest }: P) { return null }", "a.tsx");
    expect(m.get("a")).toBe(40);
    expect(m.get("b")).toBe("x");
    expect(m.get("c")).toBe(true);
    expect(m.has("d")).toBe(false);
  });
});
