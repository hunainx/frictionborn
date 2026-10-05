// Original — Frictionborn Motion metadata validator
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCHEMA_PATH = path.resolve(__dirname, "..", "schema", "meta.schema.json");

let schemaValidator: any = null;
if (fs.existsSync(SCHEMA_PATH)) {
  const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, "utf8"));
  const ajv = new (Ajv2020 as any)({ allErrors: true, strict: false, formats: { date: true } });
  schemaValidator = ajv.compile(schema);
}

const VALID_SLOTS = [
  "background",
  "headline",
  "cta",
  "media",
  "scroll-section",
  "strip",
  "page-provider",
  "composition",
];

const VALID_KINDS = ["webgl", "dom", "scroll-provider", "composition"];
const VALID_SERVER_OUTPUTS = ["poster", "final-state", "static-layout", "nothing"];
const VALID_LAZY = ["no", "in-view", "idle"];
const VALID_LOOPS = ["none", "on-interaction", "while-visible"];
const VALID_REDUCED_MOTION_MODES = ["static", "still-frame", "opacity-only", "off"];
const VALID_A11Y_ROLES = ["decorative", "content", "interactive"];
const VALID_PAUSE_CONTROLS = ["built-in", "via-runtime", "not-needed"];
const VALID_DERIVED_LICENSES = [
  "MIT",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "ISC",
  "Zlib",
  "Apache-2.0",
  "CC0-1.0",
  "Unlicense",
];

export function validateDeclaredMetadata(data: any, filePath: string): ValidationResult {
  const errors: string[] = [];

  // Schema validation via Ajv
  if (schemaValidator) {
    const valid = schemaValidator(data);
    if (!valid && schemaValidator.errors) {
      for (const err of schemaValidator.errors) {
        errors.push(`[${filePath}] Schema error at '${err.instancePath}': ${err.message}`);
      }
    }
  }

  // Hard Rule 6: Never hand-write measured metadata
  if (data.measured !== undefined) {
    errors.push(
      `[${filePath}] Hand-written 'measured' property is strictly forbidden in declared metadata (Hard Rule 6). Only 'pnpm meta' writes measured data from bench results.`
    );
  }

  // Schema version
  if (data.schemaVersion !== "0.1") {
    errors.push(`[${filePath}] Invalid schemaVersion: expected '0.1', received '${data.schemaVersion}'`);
  }

  // item
  if (!data.item) {
    errors.push(`[${filePath}] Missing required 'item' object`);
  } else {
    if (!/^[a-z][a-z0-9-]*$/.test(data.item.name || "")) {
      errors.push(`[${filePath}] 'item.name' must match pattern '^[a-z][a-z0-9-]*$'`);
    }
    if (!/^\d+\.\d+\.\d+$/.test(data.item.version || "")) {
      errors.push(`[${filePath}] 'item.version' must match semver pattern '^\\d+\\.\\d+\\.\\d+$'`);
    }
    if (typeof data.item.summary !== "string" || data.item.summary.length > 160) {
      errors.push(
        `[${filePath}] 'item.summary' must be a string with maximum length of 160 characters (current: ${
          data.item.summary?.length || 0
        })`
      );
    }
    if (!VALID_SLOTS.includes(data.item.slot)) {
      errors.push(`[${filePath}] Invalid 'item.slot': ${data.item.slot}`);
    }
    if (!VALID_KINDS.includes(data.item.kind)) {
      errors.push(`[${filePath}] Invalid 'item.kind': ${data.item.kind}`);
    }
  }

  // intent
  if (!data.intent || !Array.isArray(data.intent.useWhen) || data.intent.useWhen.length === 0) {
    errors.push(`[${filePath}] 'intent.useWhen' must be a non-empty array of strings`);
  }
  if (!data.intent || !Array.isArray(data.intent.avoidWhen) || data.intent.avoidWhen.length === 0) {
    errors.push(`[${filePath}] 'intent.avoidWhen' must be a non-empty array of strings`);
  }

  // runtime
  if (!data.runtime) {
    errors.push(`[${filePath}] Missing required 'runtime' object`);
  } else {
    if (!VALID_SERVER_OUTPUTS.includes(data.runtime.serverOutput)) {
      errors.push(`[${filePath}] Invalid 'runtime.serverOutput': ${data.runtime.serverOutput}`);
    }
    if (typeof data.runtime.clientOnly !== "boolean") {
      errors.push(`[${filePath}] 'runtime.clientOnly' must be boolean`);
    }
    if (!VALID_LAZY.includes(data.runtime.lazyLoaded)) {
      errors.push(`[${filePath}] Invalid 'runtime.lazyLoaded': ${data.runtime.lazyLoaded}`);
    }
    if (!data.runtime.requires || typeof data.runtime.requires !== "object") {
      errors.push(`[${filePath}] Missing 'runtime.requires' object`);
    }
  }

  // dependencies
  if (!data.dependencies) {
    errors.push(`[${filePath}] Missing required 'dependencies' object`);
  } else {
    if (!Array.isArray(data.dependencies.npm)) {
      errors.push(`[${filePath}] 'dependencies.npm' must be an array`);
    }
    if (!Array.isArray(data.dependencies.registry)) {
      errors.push(`[${filePath}] 'dependencies.registry' must be an array`);
    }
  }

  // behavior
  if (!data.behavior) {
    errors.push(`[${filePath}] Missing required 'behavior' object`);
  } else {
    if (!VALID_LOOPS.includes(data.behavior.loop)) {
      errors.push(`[${filePath}] Invalid 'behavior.loop': ${data.behavior.loop}`);
    }
    if (
      typeof data.behavior.webglContexts !== "number" ||
      data.behavior.webglContexts < 0 ||
      data.behavior.webglContexts > 4
    ) {
      errors.push(`[${filePath}] 'behavior.webglContexts' must be an integer between 0 and 4`);
    }
    if (!data.behavior.tiers || typeof data.behavior.tiers !== "object") {
      errors.push(`[${filePath}] Missing 'behavior.tiers' object with keys '0', '1', '2', '3'`);
    } else {
      for (const t of ["0", "1", "2", "3"]) {
        if (typeof data.behavior.tiers[t] !== "string") {
          errors.push(`[${filePath}] 'behavior.tiers.${t}' must be a string describing tier ${t} behavior`);
        }
      }
    }
    if (!data.behavior.reducedMotion) {
      errors.push(`[${filePath}] Missing 'behavior.reducedMotion'`);
    } else {
      if (!VALID_REDUCED_MOTION_MODES.includes(data.behavior.reducedMotion.mode)) {
        errors.push(`[${filePath}] Invalid 'behavior.reducedMotion.mode': ${data.behavior.reducedMotion.mode}`);
      }
      if (typeof data.behavior.reducedMotion.description !== "string") {
        errors.push(`[${filePath}] 'behavior.reducedMotion.description' must be a string`);
      }
    }
    if (!data.behavior.input) {
      errors.push(`[${filePath}] Missing 'behavior.input'`);
    } else {
      for (const inp of ["pointer", "touch", "keyboard"]) {
        if (typeof data.behavior.input[inp] !== "string") {
          errors.push(`[${filePath}] 'behavior.input.${inp}' must be a string`);
        }
      }
    }
  }

  // a11y
  if (!data.a11y) {
    errors.push(`[${filePath}] Missing required 'a11y' object`);
  } else {
    if (!VALID_A11Y_ROLES.includes(data.a11y.role)) {
      errors.push(`[${filePath}] Invalid 'a11y.role': ${data.a11y.role}`);
    }
    if (typeof data.a11y.hiddenFromAT !== "boolean") {
      errors.push(`[${filePath}] 'a11y.hiddenFromAT' must be boolean`);
    }
    if (typeof data.a11y.textStaysInDom !== "boolean") {
      errors.push(`[${filePath}] 'a11y.textStaysInDom' must be boolean`);
    }
    if (!VALID_PAUSE_CONTROLS.includes(data.a11y.pauseControl)) {
      errors.push(`[${filePath}] Invalid 'a11y.pauseControl': ${data.a11y.pauseControl}`);
    }
    if (!Array.isArray(data.a11y.wcag)) {
      errors.push(`[${filePath}] 'a11y.wcag' must be an array of WCAG guideline strings`);
    }
  }

  // composition
  if (!data.composition) {
    errors.push(`[${filePath}] Missing required 'composition' object`);
  } else {
    if (typeof data.composition.maxPerPage !== "number" || data.composition.maxPerPage < 1) {
      errors.push(`[${filePath}] 'composition.maxPerPage' must be an integer >= 1`);
    }
    if (typeof data.composition.singleton !== "boolean") {
      errors.push(`[${filePath}] 'composition.singleton' must be boolean`);
    }
    if (!Array.isArray(data.composition.conflictsWith)) {
      errors.push(`[${filePath}] 'composition.conflictsWith' must be an array`);
    }
    if (!Array.isArray(data.composition.pairsWith)) {
      errors.push(`[${filePath}] 'composition.pairsWith' must be an array`);
    }
  }

  // props
  if (!Array.isArray(data.props)) {
    errors.push(`[${filePath}] 'props' must be an array`);
  } else {
    for (let i = 0; i < data.props.length; i++) {
      const p = data.props[i];
      if (!p.name || !p.type || !p.effect) {
        errors.push(`[${filePath}] 'props[${i}]' missing required name, type, or effect`);
      }
    }
  }

  // agent
  if (!data.agent) {
    errors.push(`[${filePath}] Missing required 'agent' object`);
  } else {
    if (typeof data.agent.install !== "string") {
      errors.push(`[${filePath}] 'agent.install' must be a string`);
    }
    if (typeof data.agent.usage !== "string") {
      errors.push(`[${filePath}] 'agent.usage' must be a string`);
    }
    if (!Array.isArray(data.agent.mistakes)) {
      errors.push(`[${filePath}] 'agent.mistakes' must be an array of strings`);
    }
    if (!Array.isArray(data.agent.verify)) {
      errors.push(`[${filePath}] 'agent.verify' must be an array of strings`);
    }
  }

  // license
  if (!data.license) {
    errors.push(`[${filePath}] Missing required 'license' object`);
  } else {
    if (data.license.code !== "MIT") {
      errors.push(`[${filePath}] 'license.code' must be 'MIT'`);
    }
    if (!Array.isArray(data.license.derivedFrom)) {
      errors.push(`[${filePath}] 'license.derivedFrom' must be an array`);
    } else {
      for (let i = 0; i < data.license.derivedFrom.length; i++) {
        const d = data.license.derivedFrom[i];
        if (!VALID_DERIVED_LICENSES.includes(d.license)) {
          errors.push(
            `[${filePath}] 'license.derivedFrom[${i}].license' '${d.license}' is not in approved license list`
          );
        }
      }
    }
    if (!Array.isArray(data.license.notices)) {
      errors.push(`[${filePath}] 'license.notices' must be an array`);
    }
    if (!Array.isArray(data.license.assets)) {
      errors.push(`[${filePath}] 'license.assets' must be an array`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateAllMetadata(): boolean {
  const projectRoot = process.cwd();
  const itemsDir = path.join(projectRoot, "registry", "items");
  let hasErrors = false;
  let itemsFound = 0;

  if (!fs.existsSync(itemsDir)) {
    console.log("No registry items found to validate yet.");
    return true;
  }

  const items = fs.readdirSync(itemsDir, { withFileTypes: true });
  for (const item of items) {
    if (item.isDirectory()) {
      const declaredFile = path.join(itemsDir, item.name, "meta.declared.json");
      if (fs.existsSync(declaredFile)) {
        itemsFound++;
        try {
          const raw = fs.readFileSync(declaredFile, "utf8");
          const json = JSON.parse(raw);
          const result = validateDeclaredMetadata(json, declaredFile);
          if (!result.valid) {
            hasErrors = true;
            console.error(`❌ Validation failed for ${item.name}:`);
            for (const err of result.errors) {
              console.error(`   - ${err}`);
            }
          } else {
            console.log(`✔ ${item.name} (meta.declared.json): valid`);
          }
        } catch (err: any) {
          hasErrors = true;
          console.error(`❌ Parse error in ${declaredFile}: ${err.message}`);
        }
      }
    }
  }

  if (itemsFound === 0) {
    console.log("No items with meta.declared.json found.");
  }

  return !hasErrors;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const ok = validateAllMetadata();
  process.exit(ok ? 0 : 1);
}
