// Original — Frictionborn Motion catalog and spec sheet generator
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** What the item's own source actually does (the generator reads the code, so the sheet cannot claim what it does not do). */
export interface SourceFacts {
  readsDataMotion: boolean;
  usesFrame: boolean;
}

const esc = (v: unknown): string => String(v ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");

/** Defaults are authored loosely ("undefined", null, pre-quoted strings): show them one way. */
function renderDefault(d: unknown): string {
  if (d === undefined || d === null || d === "undefined") return "—";
  if (typeof d === "string") return /^["[{]/.test(d) ? d : JSON.stringify(d);
  return JSON.stringify(d);
}

/** DESIGN.md A4 wording. Items describe their own behaviour per tier; the meaning of a tier is fixed. */
const TIER_LABELS = [
  "T0 Static (reduced motion, Save-Data, no WebGL2, server render, or the frame guard gave up)",
  "T1 Lite (coarse pointer on a low-end device: 4 cores or fewer, or 2 GB or less)",
  "T2 Standard (coarse pointer on a capable phone, or a narrow or low-end fine-pointer screen)",
  "T3 Full (fine pointer with hover on a capable machine)",
];

export function generateItemSpecSheet(meta: any, facts: SourceFacts = { readsDataMotion: true, usesFrame: true }): string {
  const item = meta.item || {};
  const intent = meta.intent || {};
  const runtime = meta.runtime || {};
  const behavior = meta.behavior || {};
  const a11y = meta.a11y || {};
  const composition = meta.composition || {};
  const props = meta.props || [];
  const agent = meta.agent || {};
  const measured = meta.measured;
  const license = meta.license || {};
  const deps = meta.dependencies || {};
  const clsText = meta.measured && typeof meta.measured.cls === "number" ? `measured CLS ${meta.measured.cls}` : "CLS is measured by the bench";

  let md = `# ${item.name || "Component"} — Specification Sheet\n\n`;
  md += `> ${item.summary || ""}\n\n`;

  md += `## Overview\n\n`;
  md += `- **Item Name**: \`${item.name}\`\n`;
  md += `- **Version**: \`${item.version || "0.1.0"}\`\n`;
  md += `- **Slot**: \`${item.slot}\`\n`;
  md += `- **Kind**: \`${item.kind}\`\n`;
  md += `- **Install**: \`npx shadcn@latest add @frictionborn/${item.name}\`\n\n`;

  md += `## Intent\n\n`;
  md += `### Use When\n`;
  for (const u of intent.useWhen || []) {
    md += `- ${u}\n`;
  }
  md += `\n### Avoid When\n`;
  for (const a of intent.avoidWhen || []) {
    md += `- ${a}\n`;
  }
  if (intent.alternatives && intent.alternatives.length > 0) {
    md += `\n### Alternatives\n`;
    for (const alt of intent.alternatives) {
      md += `- **${alt.name}**: ${alt.when}\n`;
    }
  }
  md += `\n`;

  md += `## Runtime & Server Boundaries\n\n`;
  md += `- **Server Output**: \`${runtime.serverOutput}\` (accessible fallback in static HTML; ${clsText})\n`;
  md += `- **Client Only**: \`${runtime.clientOnly}\`\n`;
  md += `- **Lazy Loaded**: \`${runtime.lazyLoaded}\`\n`;
  if (facts.readsDataMotion) {
    md += `- **Client Reveal Gate**: This item reads \`[data-motion="ok"]\` on \`<html>\`. Next.js: render \`<MotionReadyScript />\` from \`@frictionborn/runtime\` inside \`<head>\` of the root layout (pass \`nonce\` under a strict CSP). Vite / SPA: call \`initMotionReady()\` from \`@frictionborn/runtime\` once before \`createRoot(...).render(...)\`. Without it the item stays in its static, fully visible state (no motion).\n`;
  } else {
    md += `- **Client Reveal Gate**: None. This item does not read \`data-motion\`.\n`;
  }
  if (runtime.requires) {
    md += `- **Requirements**: React \`${runtime.requires.react || ">=19"}\`, Frameworks: ${(runtime.requires.frameworks || []).join(", ") || "Next.js / Vite"}\n`;
  }
  md += `\n`;

  md += `## Behavior & Tiers\n\n`;
  md += `- **Animation Loop**: \`${behavior.loop}\`${facts.usesFrame ? " (stepped by the shared runtime `useFrame` loop)" : " (no JavaScript frame loop of its own: CSS, IntersectionObserver, or its parts)"}\n`;
  md += `- **WebGL Contexts**: \`${behavior.webglContexts}\`\n`;
  md += `- **Reduced Motion**: Mode \`${behavior.reducedMotion?.mode}\` — ${behavior.reducedMotion?.description}\n\n`;

  md += `### Device Tiers\n`;
  if (behavior.tiers) {
    for (let t = 0; t < 4; t++) md += `- **${TIER_LABELS[t]}**: ${behavior.tiers[String(t)]}\n`;
  }
  md += `\n### Input Interactions\n`;
  if (behavior.input) {
    md += `- **Pointer**: ${behavior.input.pointer}\n`;
    md += `- **Touch**: ${behavior.input.touch}\n`;
    md += `- **Keyboard**: ${behavior.input.keyboard}\n`;
  }
  md += `\n`;

  md += `## Accessibility (a11y)\n\n`;
  md += `- **Role**: \`${a11y.role}\`\n`;
  md += `- **Hidden from Assistive Tech**: \`${a11y.hiddenFromAT}\`\n`;
  md += `- **Text Stays in DOM**: \`${a11y.textStaysInDom}\`\n`;
  md += `- **Pause Control**: \`${a11y.pauseControl}\`\n`;
  if (a11y.wcag && a11y.wcag.length > 0) {
    md += `- **WCAG Criteria**: ${a11y.wcag.join(", ")}\n`;
  }
  if (a11y.notes) {
    md += `- **Notes**: ${a11y.notes}\n`;
  }
  md += `\n`;

  md += `## Composition\n\n`;
  md += `- **Max Per Page**: ${composition.maxPerPage}\n`;
  md += `- **Singleton**: ${composition.singleton}\n`;
  md += `- **Conflicts With**: ${(composition.conflictsWith || []).join(", ") || "None"}\n`;
  md += `- **Pairs Well With**: ${(composition.pairsWith || []).join(", ") || "None"}\n\n`;

  md += `## Props\n\n`;
  md += `| Prop | Type | Default | Effect |\n`;
  md += `|---|---|---|---|\n`;
  for (const p of props) {
    md += `| \`${esc(p.name)}\` | \`${esc(p.type)}\` | \`${esc(renderDefault(p.default))}\` | ${esc(p.effect)} |\n`;
  }
  md += `\n`;

  md += `## Dependencies\n\n`;
  md += `- **Runtime package**: \`@frictionborn/runtime\` (installed by the registry item)\n`;
  const regDeps: string[] = deps.registry || [];
  md += `- **Registry items pulled in**: ${regDeps.length ? regDeps.map((r) => `\`${r}\``).join(", ") : "none"}\n`;
  const npmDeps: any[] = deps.npm || [];
  md += `- **npm packages**: ${npmDeps.length ? npmDeps.map((n) => `\`${typeof n === "string" ? n : `${n.name}@${n.version}`}\``).join(", ") : "none"}\n\n`;

  md += `## Agent Instructions\n\n`;
  md += `### Installation\n\`\`\`bash\n${agent.install || `npx shadcn@latest add @frictionborn/${item.name}`}\n\`\`\`\n\n`;
  md += `### Usage\n\`\`\`tsx\n${agent.usage || `import { ${item.name} } from "@/components/ui/${item.name}";`}\n\`\`\`\n\n`;
  if (agent.mistakes && agent.mistakes.length > 0) {
    md += `### Common Mistakes to Avoid\n`;
    for (const m of agent.mistakes) {
      md += `- ${m}\n`;
    }
    md += `\n`;
  }
  if (agent.verify && agent.verify.length > 0) {
    md += `### How to Verify\n`;
    for (const v of agent.verify) {
      md += `- ${v}\n`;
    }
    md += `\n`;
  }

  if (measured) {
    md += `## Measured Bench Evidence\n\n`;
    md += `- **Bench Commit**: \`${measured.commit}\` (${measured.date})\n`;
    if (measured.sizeKB) {
      const deferred = measured.sizeKB.deferred >= 0.1 ? `${measured.sizeKB.deferred} KiB` : "none";
      md += `- **Size**: ${measured.sizeKB.initial} KiB initial / ${deferred} deferred. Gzip of this item's own source files only (method: ${measured.sizeKB.method}); excludes the runtime, third-party packages and any registry items it pulls in.\n`;
    }
    md += `- **Cumulative Layout Shift (CLS)**: \`${measured.cls}\`\n`;
    if (measured.framesWhenIdle) {
      md += `- **Frames When Idle**:\n`;
      md += `  - Off-screen: ${measured.framesWhenIdle.offscreen} frames\n`;
      md += `  - Hidden tab: ${measured.framesWhenIdle.hiddenTab} frames\n`;
      md += `  - Reduced motion: ${measured.framesWhenIdle.reducedMotion} frames\n`;
    }
    if (measured.axe) {
      md += `- **axe-core Violations**: Serious: ${measured.axe.serious}, Critical: ${measured.axe.critical}\n`;
    }
    if (measured.devices && measured.devices.length > 0) {
      md += `\n### Verified Devices\n`;
      md += `| Environment | Via | Tier | Result | Date | Notes |\n`;
      md += `|---|---|---|---|---|---|\n`;
      for (const d of measured.devices) {
        md += `| ${d.env} | ${d.via} | ${d.tier} | ${d.result} | ${d.date} | ${d.notes || "—"} |\n`;
      }
    }
    md += `\n`;
  }

  md += `## License & Provenance\n\n`;
  md += `- **Code License**: ${license.code || "MIT"}\n`;
  if (license.derivedFrom && license.derivedFrom.length > 0) {
    md += `- **Derived From**:\n`;
    for (const d of license.derivedFrom) {
      md += `  - ${d.what ?? d.name}: [${d.url}](${d.url}) (${d.license})\n`;
    }
  } else {
    md += `- **Origin**: Original implementation for Frictionborn Motion.\n`;
  }
  const assets: any[] = license.assets || [];
  if (assets.length) {
    md += `- **Demo assets** (not shipped in the registry item):\n`;
    for (const a of assets) md += `  - ${typeof a === "string" ? a : `${a.title ?? a.file ?? a.name ?? JSON.stringify(a)}${a.license ? ` (${a.license})` : ""}`}\n`;
  }
  const notices: any[] = license.notices || [];
  for (const n of notices) md += `- **Notice**: ${typeof n === "string" ? n : (n.text ?? JSON.stringify(n))}\n`;

  return md;
}

const SETUP_MD = `1. Register the namespace once, in \`components.json\` (use the registry URL published with the release):
\`\`\`json
{ "registries": { "@frictionborn": "<registry-base-url>/r/{name}.json" } }
\`\`\`
2. Install an item (the shadcn CLI also installs the registry items it depends on, and \`@frictionborn/runtime\`):
\`\`\`bash
npx shadcn@latest add @frictionborn/<component-name>
\`\`\`
3. Items whose sheet lists a "Client Reveal Gate" need one line: Next.js renders \`<MotionReadyScript />\` in \`<head>\` of the root layout; Vite / SPA calls \`initMotionReady()\` before the first render. Both come from \`@frictionborn/runtime\`.
`;

export function generateCatalog(items: any[]): string {
  let md = `# Frictionborn Motion — Component Catalog\n\n`;
  md += `Verified motion and WebGL components with strict zero-slop budgets, server-safe rendering, and unified frame scheduling.\n\n`;

  md += `## Components\n\n`;
  md += `| Component | Slot | Kind | Reduced Motion | Server Output | Summary |\n`;
  md += `|---|---|---|---|---|---|\n`;
  for (const m of items) {
    const item = m.item || {};
    const rm = m.behavior?.reducedMotion?.mode || "—";
    const so = m.runtime?.serverOutput || "—";
    md += `| [${item.name}](items/${item.name}.md) | \`${item.slot}\` | \`${item.kind}\` | \`${rm}\` | \`${so}\` | ${item.summary} |\n`;
  }
  md += `\n`;

  md += `## Architectural Guarantees\n\n`;
  md += `1. **Layout stability**: static HTML matches the initial client dimensions (serverOutput: poster / final-state / static-layout); each sheet lists the measured CLS (budget: 0.01 or less).\n`;
  md += `2. **Idle overhead**: animation loops stop when the item is off-screen or the tab is hidden (frames-when-idle is measured and listed on each sheet).\n`;
  md += `3. **Exact Reduced Motion**: Static fallbacks honored strictly per user preferences.\n`;
  md += `4. **Strict Accessibility**: Text stays in the DOM, native interactive elements preserved.\n\n`;

  md += `## Installation Guide\n\n`;
  md += SETUP_MD;

  return md;
}

export function generateLlmsTxt(items: any[]): string {
  let txt = `# Frictionborn Motion\n\n`;
  txt += `> Frictionborn Motion is a verified motion and WebGL component registry for React 19 and Next.js 16, engineered for zero visual slop, static server rendering, and zero-idle resource usage.\n\n`;
  txt += `Docs: https://frictionborn.com/docs\n`;
  txt += `Registry: https://frictionborn.com/r\n\n`;
  txt += `## Core Principles\n`;
  txt += `- **Server Output is Static**: No opacity: 0 or transforms in server HTML. Hidden-before-reveal CSS only under [data-motion="ok"].\n`;
  txt += `- **Single Frame Loop**: Animated items share one loop (useFrame from @frictionborn/runtime). Direct requestAnimationFrame is forbidden.\n`;
  txt += `- **Strict WebGL Leases**: At most 4 live WebGL contexts per page on a fine pointer, 2 on coarse. WebGL code loads only when leased.\n`;
  txt += `- **Reduced Motion is Architectural**: Mode is declared and verified (static, still-frame, opacity-only, or off).\n\n`;
  txt += `## Components\n\n`;
  txt += `| Item | Slot | Summary | Spec Sheet |\n`;
  txt += `| :--- | :--- | :--- | :--- |\n`;
  for (const m of items) {
    const item = m.item || {};
    txt += `| [${item.name}](https://frictionborn.com/docs/items/${item.name}) | \`${item.slot || "ui"}\` | ${item.summary} | [Spec Sheet](agents/skill/frictionborn/references/items/${item.name}.md) |\n`;
  }
  txt += `\n## Setup\n${SETUP_MD}`;
  txt += `\n## Runtime Usage\n`;
  txt += `\`\`\`tsx\nimport { MotionReadyScript, initMotionReady, useFrame, useReducedMotion } from "@frictionborn/runtime";\n\`\`\`\n`;
  return txt;
}

function readSourceFacts(itemDir: string): SourceFacts {
  const src = fs
    .readdirSync(itemDir)
    .filter((f) => /\.(tsx|ts)$/.test(f) && f !== "demo.tsx")
    .map((f) => fs.readFileSync(path.join(itemDir, f), "utf8"))
    .join("\n");
  return { readsDataMotion: /data-motion/.test(src), usesFrame: /\buseFrame\b/.test(src) };
}

export function buildCatalog(): boolean {
  const projectRoot = process.cwd();
  const itemsDir = path.join(projectRoot, "registry", "items");
  const agentRefDir = path.join(projectRoot, "agents", "skill", "frictionborn", "references");
  const itemsRefDir = path.join(agentRefDir, "items");

  fs.mkdirSync(itemsRefDir, { recursive: true });

  const loadedItems: any[] = [];

  if (fs.existsSync(itemsDir)) {
    const entries = fs.readdirSync(itemsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const metaPath = path.join(itemsDir, entry.name, "meta.json");
        const declaredPath = path.join(itemsDir, entry.name, "meta.declared.json");

        const targetFile = fs.existsSync(metaPath) ? metaPath : fs.existsSync(declaredPath) ? declaredPath : null;
        if (targetFile) {
          try {
            const meta = JSON.parse(fs.readFileSync(targetFile, "utf8"));
            if (meta.fixture === true) {
              // Internal test fixture: delete any stale public spec sheet and exclude from catalog
              const staleSpec = path.join(itemsRefDir, `${entry.name}.md`);
              if (fs.existsSync(staleSpec)) {
                fs.unlinkSync(staleSpec);
              }
              continue;
            }
            loadedItems.push(meta);

            // Generate individual spec sheet
            const specSheet = generateItemSpecSheet(meta, readSourceFacts(path.join(itemsDir, entry.name)));
            const specFile = path.join(itemsRefDir, `${entry.name}.md`);
            fs.writeFileSync(specFile, specSheet, "utf8");
            console.log(`✔ Generated spec sheet: ${path.relative(projectRoot, specFile)}`);
          } catch (err: any) {
            console.error(`❌ Failed to process ${targetFile}: ${err.message}`);
          }
        }
      }
    }
  }

  // Generate catalog.md
  const catalogMd = generateCatalog(loadedItems);
  const catalogFile = path.join(agentRefDir, "catalog.md");
  fs.writeFileSync(catalogFile, catalogMd, "utf8");
  console.log(`✔ Generated catalog: ${path.relative(projectRoot, catalogFile)}`);

  // Generate llms.txt at root
  const llmsTxt = generateLlmsTxt(loadedItems);
  const llmsFile = path.join(projectRoot, "llms.txt");
  fs.writeFileSync(llmsFile, llmsTxt, "utf8");
  console.log(`✔ Generated llms.txt: ${path.relative(projectRoot, llmsFile)}`);

  return true;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const ok = buildCatalog();
  process.exit(ok ? 0 : 1);
}
