// Original — Frictionborn Motion base configuration
// Single source of truth for site and registry URLs per PRD / user requirements.

export const SITE_URL: string = (
  process.env.SITE_URL ||
  process.env.REGISTRY_BASE_URL ||
  "https://frictionborn.com"
).replace(/\/+$/, "");

export const REGISTRY_BASE_URL: string = (
  process.env.REGISTRY_BASE_URL ||
  SITE_URL
).replace(/\/+$/, "");
