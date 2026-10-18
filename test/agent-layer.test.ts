// Original — audit M4: the agent layer (step 11) is generated or checked against the metadata, not trusted.
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { SHADCN_CLI, SKILL_TABLE_BEGIN, SKILL_TABLE_END, generateSkillDecisionTable } from "../scripts/build-catalog.ts";

const root = path.resolve(__dirname, "..");
const read = (...p: string[]) => fs.readFileSync(path.join(root, ...p), "utf8").split("\r\n").join("\n");
const itemsDir = path.join(root, "registry", "items");
const metas = fs
  .readdirSync(itemsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => JSON.parse(read("registry", "items", d.name, "meta.json")))
  .filter((m) => !m.fixture);

describe("agent layer", () => {
  const skill = read("skills", "frictionborn", "SKILL.md");
  const snippet = read("agents", "AGENTS.snippet.md");

  it("the SKILL.md decision table is exactly what the generator builds from meta.json", () => {
    const a = skill.indexOf(SKILL_TABLE_BEGIN);
    const b = skill.indexOf(SKILL_TABLE_END);
    expect(a).toBeGreaterThan(-1);
    expect(b).toBeGreaterThan(a);
    expect(skill.slice(a + SKILL_TABLE_BEGIN.length + 1, b)).toBe(generateSkillDecisionTable(metas));
  });

  it("the table has one row per catalog item, each linking its spec sheet", () => {
    expect(metas.length).toBe(25);
    for (const m of metas) expect(skill).toContain(`(references/items/${m.item.name}.md)`);
  });

  it("SKILL.md stays under 150 lines and the snippet under 40", () => {
    expect(skill.trim().split("\n").length).toBeLessThan(150);
    expect(snippet.trim().split("\n").length).toBeLessThan(40);
  });

  it("every install command (skill, snippet, catalog, llms.txt, spec sheets, item metadata) uses the one pinned CLI", () => {
    const files = [
      ["skills", "frictionborn", "SKILL.md"],
      ["agents", "AGENTS.snippet.md"],
      ["skills", "frictionborn", "references", "catalog.md"],
      ["llms.txt"],
    ];
    for (const f of files) {
      const text = read(...f);
      expect(text, f.join("/")).toContain(`npx ${SHADCN_CLI} add`);
      expect(text, f.join("/")).not.toMatch(/shadcn@latest/);
    }
    for (const m of metas) {
      const sheet = read("skills", "frictionborn", "references", "items", `${m.item.name}.md`);
      expect(sheet, m.item.name).not.toMatch(/shadcn@latest/);
      expect(m.agent.install, m.item.name).toContain(SHADCN_CLI);
    }
  });

  it("the skill states the install steps an agent needs: namespace in components.json, the add command, the reveal gate", () => {
    for (const needle of ['"@frictionborn"', "components.json", `npx ${SHADCN_CLI} add @frictionborn/`, "MotionReadyScript", "initMotionReady", "nonce"]) {
      expect(skill, needle).toContain(needle);
    }
  });

  it("the skill names no prop that does not exist and no removed one", () => {
    expect(skill).not.toMatch(/strength=\{\d|resolveCssColor|ease-spring/);
  });

  it("llms.txt does not call a composition 'fixed demo copy' any more", () => {
    expect(read("llms.txt")).not.toMatch(/fixed demo copy/i);
  });
});
