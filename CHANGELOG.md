# Changelog

## Unreleased

- Added the AI-KIT docs site: React 19 + Vite 8 + TypeScript static page with an installation guide for five runners (pip/pipx, `python -m`, isolated venv, Docker image, source checkout) on PowerShell and Bash.
- Added the command configurator for new installations and updates: clients, presets, sharing mode, chat language, conventions, all `--with-*` modules, `--interactive`, `--check` and `--accept-local`, with validation, Docker session setup, bootstrap instructions, a `settings.json` preview, an installed-file tree and URL share links.
- Added `doctor`, `route`, `context select`, `providers` and `check` builders, a filterable flag reference, preset matrix, features and FAQ in English and Russian with light and dark themes.
- Pinned the CLI contract to AI-KIT 1.4.5 (`e569b7b`); `scripts/footprint.py` derives the file model from installer previews, and tests run generated options through the real installer and quoted values through Bash and PowerShell.
- Added the GitHub Pages workflow: lint, tests against the pinned release, build and deploy from `main`.
