// Original — Frictionborn Motion catalog and spec sheet generator
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function generateItemSpecSheet(meta: any): string {
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
  md += `- **Server Output**: \`${runtime.serverOutput}\` (No layout shift, accessible fallback in static HTML)\n`;
  md += `- **Client Only**: \`${runtime.clientOnly}\`\n`;
  md += `- **Lazy Loaded**: \`${runtime.lazyLoaded}\`\n`;
  if (runtime.requires) {
    md += `- **Requirements**: React \`${runtime.requires.react || ">=19"}\`, Frameworks: ${(runtime.requires.frameworks || []).join(", ") || "Next.js / Vite"}\n`;
  }
  md += `\n`;

  md += `## Behavior & Tiers\n\n`;
  md += `- **Animation Loop**: \`${behavior.loop}\` (managed via runtime \`useFrame\`)\n`;
  md += `- **WebGL Contexts**: \`${behavior.webglContexts}\`\n`;
  md += `- **Reduced Motion**: Mode \`${behavior.reducedMotion?.mode}\` — ${behavior.reducedMotion?.description}\n\n`;

  md += `### Device Tiers\n`;
  if (behavior.tiers) {
    md += `- **Tier 0** (Low-end / Battery saver): ${behavior.tiers["0"]}\n`;
    md += `- **Tier 1** (Mid-range mobile): ${behavior.tiers["1"]}\n`;
    md += `- **Tier 2** (Standard desktop / modern mobile): ${behavior.tiers["2"]}\n`;
    md += `- **Tier 3** (High performance GPU): ${behavior.tiers["3"]}\n`;
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
    const def = p.default !== undefined ? JSON.stringify(p.default) : "—";
    md += `| \`${p.name}\` | \`${p.type}\` | \`${def}\` | ${p.effect} |\n`;
  }
  md += `\n`;

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
      md += `- **Size**: ${measured.sizeKB.initial} KB initial / ${measured.sizeKB.deferred} KB deferred (gzip, via ${measured.sizeKB.method})\n`;
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
      md += `  - ${d.what}: [${d.url}](${d.url}) (${d.license})\n`;
    }
  } else {
    md += `- **Origin**: Original implementation for Frictionborn Motion.\n`;
  }

  return md;
}

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
  md += `1. **Zero Layout Shift**: Static HTML matches initial client dimensions (serverOutput: poster / final-state / static-layout).\n`;
  md += `2. **Zero Idle Overhead**: All loops pause when off-screen or tab is hidden.\n`;
  md += `3. **Exact Reduced Motion**: Static fallbacks honored strictly per user preferences.\n`;
  md += `4. **Strict Accessibility**: Text stays in the DOM, native interactive elements preserved.\n\n`;

  md += `## Installation Guide\n\n`;
  md += `All components install via the shadcn CLI:\n\`\`\`bash\nnpx shadcn@latest add @frictionborn/<component-name>\n\`\`\`\n`;

  return md;
}

export function generateLlmsTxt(items: any[]): string {
  let txt = `# Frictionborn Motion\n\n`;
  txt += `> Frictionborn Motion is a library of verified motion and WebGL UI components built for React 19 and Next.js 16, engineered for zero visual slop, static server rendering, and zero-idle resource usage.\n\n`;
  txt += `## Core Principles\n`;
  txt += `- **Server Output is Static**: No opacity: 0 or transforms in server HTML. Hidden-before-reveal CSS only under [data-motion="ok"].\n`;
  txt += `- **Single Frame Loop**: All components use useFrame from @frictionborn/runtime. Direct requestAnimationFrame is forbidden.\n`;
  txt += `- **Strict WebGL Leases**: Max 4 WebGL contexts active per page. WebGL code is dynamically loaded only when in view and lease granted.\n`;
  txt += `- **Reduced Motion is Architectural**: Mode is declared and verified (static, still-frame, opacity-only, or off).\n\n`;
  txt += `## Components\n`;
  for (const m of items) {
    const item = m.item || {};
    txt += `- **${item.name}**: ${item.summary} (Install: \`npx shadcn@latest add @frictionborn/${item.name}\`)\n`;
  }
  txt += `\n## Runtime Usage\n`;
  txt += `\`\`\`tsx\nimport { MotionReadyScript, useFrame, useReducedMotion } from "@frictionborn/runtime";\n\`\`\`\n`;
  return txt;
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
            loadedItems.push(meta);

            // Generate individual spec sheet
            const specSheet = generateItemSpecSheet(meta);
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
