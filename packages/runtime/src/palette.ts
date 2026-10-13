// Original — Frictionborn Motion palettes (DESIGN.md A9): one token contract for every item that draws in colour
/**
 * Every item that draws in colour takes `palette`: `fire` (the default, the site's own colours), `ice`, `neon`, `mono`, or `custom`.
 * A palette is five colours from cold to white-hot. Items read them as CSS custom properties, so a preset and a custom palette go
 * through the same path:
 *
 *   --fb-heat-0  coldest (deep background, unlit)
 *   --fb-heat-1  dark glow
 *   --fb-heat-2  the hot colour (the accent)
 *   --fb-heat-3  bright
 *   --fb-heat-4  white-hot
 *
 * A preset sets the five on the item's root (`paletteVars`). `custom` sets nothing: the item reads whatever the page defines (on the
 * item, a parent or `:root`); anything missing falls back to `fire`. Canvas and WebGL code never receive the variables as strings: they
 * are resolved to RGB first (`readPalette`, AGENTS lesson 9).
 */
import { resolveCssColor } from "./color.js";

export type PaletteName = "fire" | "ice" | "neon" | "mono" | "custom";
export type PaletteColors = readonly [string, string, string, string, string];

export const PALETTES: Readonly<Record<Exclude<PaletteName, "custom">, PaletteColors>> = {
  fire: ["#1C1A18", "#7A1D10", "#E8590C", "#FFB15C", "#FFF4E0"],
  ice: ["#0A1220", "#14407A", "#3D8BFF", "#9CCBFF", "#F0F8FF"],
  neon: ["#120A1F", "#5B1A8C", "#FF2BD6", "#5CF2FF", "#F4FFFE"],
  mono: ["#141414", "#3A3A3A", "#8C8C8C", "#CFCFCF", "#FFFFFF"],
};

/** the preset names, in the order the docs show them */
export const PALETTE_NAMES = ["fire", "ice", "neon", "mono"] as const;

export const HEAT_VARS = ["--fb-heat-0", "--fb-heat-1", "--fb-heat-2", "--fb-heat-3", "--fb-heat-4"] as const;

/** the inline style of an item's root for a palette: the five variables for a preset, nothing for `custom` */
export function paletteVars(palette: PaletteName = "fire"): Record<string, string> {
  if (palette === "custom") return {};
  const c = PALETTES[palette] ?? PALETTES.fire;
  const out: Record<string, string> = {};
  HEAT_VARS.forEach((v, i) => (out[v] = c[i]));
  return out;
}

/** the five colours an element sees, resolved to 0..255 RGB (custom values the page set, else the preset, else `fire`) */
export function readPalette(el: Element | null, palette: PaletteName = "fire"): Array<[number, number, number]> {
  const preset = PALETTES[palette === "custom" ? "fire" : palette] ?? PALETTES.fire;
  const style = el && typeof getComputedStyle === "function" ? getComputedStyle(el) : null;
  return HEAT_VARS.map((v, i) => {
    const set = style?.getPropertyValue(v).trim();
    const c = set ? resolveCssColor(el, set) : null;
    return c ? [c[0] * 255, c[1] * 255, c[2] * 255] : hexRgb(preset[i]);
  });
}

function hexRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
