# Changelog

## Unreleased

- Updated the CLI contract to AI-KIT 1.4.6 (`763bef0`): the configurator, `settings.json` preview, share links (`cleanup`) and flag reference (now 24 rows) cover `--docker-cleanup maximum|keep-cache`, persisted as `docker_cleanup` with fresh default `maximum`.
- `doctor --fix` now generates a preview command and a separate `--fix --apply` write, with notes that `--apply` needs `--fix` and that 1.4.5 and earlier write with `--fix` alone.
- Docker commands keep the latest published image `tigusigalpa/ai-kit:1.4.5` (tracked as `imageVersion`): `--docker-cleanup` is blocked for that runner, the doctor repair uses commands the image accepts, and notes explain the 1.4.5 differences.
- Rewrote the `--with-ci` texts (validates committed AI-KIT files with pinned actions, installs nothing, meaningful in team mode), the Docker feature card, the `--check` exit-code notes and the v1.4.6 release note; guide links now point to `docs/guide/` instead of removed README anchors.
- Regenerated `src/data/footprint.json` from 1.4.6 previews (`--with-security-audit` no longer installs upstream `*.test.cjs` files); upstream tests now also compare the flag reference with the installer `--help` usage and check `doctor --fix` preview/apply behavior.
- Added the AI-KIT docs site: React 19 + Vite 8 + TypeScript static page with an installation guide for five runners (pip/pipx, `python -m`, isolated venv, Docker image, source checkout) on PowerShell and Bash.
- Added the command configurator for new installations and updates: clients, presets, sharing mode, chat language, conventions, all `--with-*` modules, `--interactive`, `--check` and `--accept-local`, with validation, Docker session setup, bootstrap instructions, a `settings.json` preview, an installed-file tree and URL share links.
- Added `doctor`, `route`, `context select`, `providers` and `check` builders, a filterable flag reference, preset matrix, features and FAQ in English and Russian with light and dark themes.
- Pinned the CLI contract to AI-KIT 1.4.5 (`e569b7b`); `scripts/footprint.py` derives the file model from installer previews, and tests run generated options through the real installer and quoted values through Bash and PowerShell.
- Added the GitHub Pages workflow: lint, tests against the pinned release, build and deploy from `main`.
