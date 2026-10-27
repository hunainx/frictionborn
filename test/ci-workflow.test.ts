// Original — Frictionborn Motion: CI failed before any job started ("workflow file issue", 0 jobs) because the cheap bench job
// had `if: !(… || env.FULL_MATRIX == 'true')`: an unquoted value starting with `!` is a YAML tag, and a job-level `if` may only
// read the github, needs, vars and inputs contexts
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "..");
const workflowDir = path.join(root, ".github", "workflows");
const files = [
  ...fs.readdirSync(workflowDir).filter((f) => /\.ya?ml$/.test(f)).map((f) => path.join(workflowDir, f)),
  path.join(root, "docs", "public-library", "ci.yml"),
].filter((f) => fs.existsSync(f));

function jobConditions(text: string): string[] {
  // a job-level key sits at four spaces under `jobs:`; step-level `if:` keys are indented further
  const jobs = text.slice(text.search(/^jobs:/m));
  return [...jobs.matchAll(/^ {4}if:[ \t]*(.*)$/gm)].map((m) => m[1].trim());
}

describe("GitHub Actions workflows", () => {
  it("finds the workflows", () => {
    expect(files.some((f) => f.endsWith(path.join("workflows", "ci.yml")))).toBe(true);
  });

  it.each(files.map((f) => [path.relative(root, f).split(path.sep).join("/"), f]))("%s: every job-level if parses and reads only allowed contexts", (_name, file) => {
    const conditions = jobConditions(fs.readFileSync(file, "utf8"));
    for (const condition of conditions) {
      expect(condition, condition).not.toMatch(/^[!&*]/);
      expect(condition, condition).not.toMatch(/\b(env|secrets|steps|matrix|job|runner)\./);
    }
  });

  it("keeps the FULL_MATRIX switch working: full bench and cheap bench are opposite conditions on vars.FULL_MATRIX", () => {
    for (const file of files.filter((f) => f.endsWith("ci.yml"))) {
      const text = fs.readFileSync(file, "utf8");
      const bench = /^ {2}bench:\n(?: {4}.*\n)*? {4}if: \$\{\{ (.*) \}\}$/m.exec(text)?.[1];
      const cheap = /^ {2}bench-cheap:\n(?: {4}.*\n)*? {4}if: \$\{\{ (.*) \}\}$/m.exec(text)?.[1];
      expect(bench, file).toContain("vars.FULL_MATRIX == 'true'");
      expect(cheap, file).toBe(`!(${bench})`);
    }
  });
});
