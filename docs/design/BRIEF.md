# Website brief

This is project-owned design memory. Current project facts remain in [PROJECT_CONTEXT](../../PROJECT_CONTEXT.md) when that local file is present.

## Outcome and scope

- Product/subject, audience and primary user task: a documentation and command-builder site for [AI-KIT](https://github.com/tigusigalpa/ai-kit). Developers who use coding agents learn what the kit does, install its CLI and generate a correct `aikit install` command for their project.
- Main action and success criteria: copy a preview command and a matching apply command that the real installer accepts, then bootstrap the agent. Success means generated options match installer behavior for the pinned release (checked in `tests/upstream.test.ts`).
- Pages/sections: one page — hero, supported clients, three steps, release note, installation guide, configurator, more commands, features, flag reference, FAQ, footer.
- Required behavior: client-side generation only; no backend, accounts, analytics, remote fonts or network calls; share links keep choices in the URL query.
- Confirmed stack: React 19.3.1, Vite 8.3.5, TypeScript 5.9, Vitest 5; deployed to GitHub Pages from `.github/workflows/pages.yml`.
- Languages, devices and accessibility: English default with Russian toggle (browser language or saved choice); light and dark themes; phone to wide desktop; keyboard-operable controls, visible focus, reduced motion respected.
- Content and assets: text derived from the AI-KIT 1.4.5 README, the 1.4.6–1.5.0 changelog, user guides (`docs/guide/`), installer, doctor, MCP report, flag schema and agent registry; original SVG logo and icons; fonts Onest and JetBrains Mono from `@fontsource-variable` (OFL), bundled.
- Open choices: a custom domain is not configured; TypeUI was not connected for this version.

## Annotated references

| Reference/page | What to learn from it | Observed state/viewport | Evidence or missing access |
| --- | --- | --- | --- |
| [LaraShip configurator](https://github.com/shellharbor/laraship-docs) (sibling project) | Section order (hero with terminal, steps, install guide before the wizard, reference, FAQ), shared runner choice across guide and builder, EN/RU toggle, pinned upstream contract with tests | Source code at its default branch, read 2026-10-30 | Source reviewed; live page not inspected |
| AI-KIT README v1.4.5 | Content, flag semantics, presets, Docker and Windows procedures | Tag `v1.4.5` | Read in full for installer and Docker sections |
| AI-KIT v1.4.6 changelog, `docs/guide/INSTALLER_FLAGS.md`, `scripts/install.py`, `scripts/doctor.py` | `--docker-cleanup`, `doctor --fix` preview/apply, `--with-ci` contract, release summary | Tag `v1.4.6`, read 2026-10-30 | Flags and choices also compared with the installer `--help` in tests |
| AI-KIT v1.4.7 and v1.5.0 changelog, `integrations/installer-flags.json`, `docs/guide/INSTALL.md#review-mcp-servers`, `scripts/flags.py`, `scripts/mcp_report.py`, `scripts/install.py`, `scripts/doctor.py` | `aikit flags`, `aikit mcp report`, `--allow-downgrade` and the doctor upgrade hints | Release commit of 1.5.0, read 2026-10-31 | Flag reference also compared with the schema; new commands and the downgrade guard run in tests |

## Decisions

- A distinct visual identity from LaraShip: warm paper background, ink text, violet accent with a lime signal colour and dark terminal surfaces, so the two sibling sites read as a family without looking identical.
- See [SYSTEM](SYSTEM.md) for tokens and components and [ACCEPTANCE](ACCEPTANCE.md) for checks.
