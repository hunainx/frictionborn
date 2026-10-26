## What this changes

<!-- One or two sentences. Link the issue it fixes, if there is one. -->

## Checks I ran

<!-- Paste the command and the result, or tick "not needed" with a reason. -->

- [ ] `pnpm lint`
- [ ] `pnpm test`
- [ ] `pnpm size` (if the runtime changed)
- [ ] `pnpm bench --item <name>` (if an item changed)
- [ ] Not needed, because:

## Generated files

- [ ] If I changed an item, `meta.declared.json` or a script, I ran `pnpm meta` and `pnpm registry:build` and committed the output.
- [ ] I did not edit `measured` data, spec sheets, `catalog.md`, `llms.txt` or `public/r` by hand.

## Other

- [ ] New source files start with `// Original` or a `// Source:` header, and any new dependency was agreed in an issue first.
- [ ] A change to `@frictionborn/runtime` has a changeset (`pnpm changeset`).
- [ ] This is not a security fix. Those are reported privately, see `SECURITY.md`.
