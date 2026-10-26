# Security

This file lists what exists today and, separately, what is planned for launch.

## Supply chain (in place)
- Exact-pinned versions for every runtime dependency in this repository; `lenis@1.3.26` is the only third-party runtime dependency (allowlist in [AGENTS.md](AGENTS.md)). Renovate is configured (`renovate.json`): pinned ranges, one weekly update group, no automerge.
- `scripts/build-registry.ts` emits only `registry:ui` and `registry:block` items. Every file target must stay inside `components/ui/` (checked, the build fails otherwise), npm dependencies must be on an allowlist, and items carry no `envVars` and no install scripts.
- CI runs the licence scan (rejects GPL/AGPL/LGPL/Commons Clause/non-commercial) and the provenance and duplicate-code checks through `pnpm lint`, and checks that generated registry files match the committed ones.
- `pnpm audit` is **not** run in CI.

## Planned for launch (not in place)
- Publish `@frictionborn/runtime` via npm trusted publishing (OIDC) with provenance; no long-lived npm tokens; 2FA (FIDO) on the npm and GitHub orgs. The package is not on npm yet.
- Each release publishes a sha256 manifest of all item JSON, signed (Sigstore/cosign).
- A `pnpm audit` step in CI.

## Reporting a Vulnerability

Please do not report security vulnerabilities through public GitHub issues.

Instead, please use GitHub Private Vulnerability Reporting:
https://github.com/hunainx/frictionborn/security/advisories/new

Reports are acknowledged within 48 hours and handled privately until a patch and advisory are published.
