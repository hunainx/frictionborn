// Original — Frictionborn Motion base configuration
// Single source of truth for site and registry URLs per PRD / user requirements.

export const REPO_SLUG: string = process.env.REPO_SLUG || "hunainx/frictionborn";
export const REPO_URL: string = `https://github.com/${REPO_SLUG}`;
export const SKILL_INSTALL_COMMAND: string = `npx skills add ${REPO_SLUG}`;

export const SITE_URL: string = (
  process.env.SITE_URL ||
  process.env.REGISTRY_BASE_URL ||
  "https://frictionborn.com"
).replace(/\/+$/, "");

export const REGISTRY_BASE_URL: string = (
  process.env.REGISTRY_BASE_URL ||
  SITE_URL
).replace(/\/+$/, "");
