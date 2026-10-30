# AI-KIT docs and command configurator

A static React + TypeScript site for [AI-KIT](https://github.com/tigusigalpa/ai-kit): an installation guide and a configurator that builds `aikit install` commands in the browser. It never runs the installer, connects to a project or sends your choices anywhere.

Live site: <https://tigusigalpa.github.io/ai-kit-docs/>

The CLI contract is pinned to **AI-KIT 1.4.6**, tag `v1.4.6`, commit `763bef0dfe600bac6b2a131d254061abcf0ffb6a` ([src/data/upstream.ts](src/data/upstream.ts)). The latest published Docker image is still `1.4.5`, recorded separately as `imageVersion`; Docker commands use that tag and avoid options it does not accept.

## What the site covers

- **Installation** for five runners — `aikit` from pip/pipx, `python -m aikit.aikit_cli`, an isolated virtual environment, the published `tigusigalpa/ai-kit:1.4.5` Docker image and a source checkout — each for Windows PowerShell and Linux/macOS Bash.
- **Configurator** for a new installation or an update: target folder, 11 AI clients, presets, sharing mode, chat language, conventions, Docker cleanup mode, all eleven `--with-*` modules, `--interactive`, `--check` and `--accept-local`. It shows the preview and apply commands, Docker session setup, the bootstrap step per client, the resulting `ai-kit/settings.json` and the files a preview lists for an empty folder.
- **Share links**: the configuration is encoded in the URL query only.
- **More commands**: `doctor` (including the `--fix` preview and `--fix --apply` repair), `route`, `context select`, `providers` and `check` with the same runner.
- **Reference**: every installer flag with a filter, the preset matrix, valid agent names and exit codes; features and FAQ.
- English and Russian, light and dark themes, bundled fonts (Onest, JetBrains Mono), no analytics or remote requests.

## Develop

Use Node.js 22.12+ (tested with 24.17.0) and the committed lockfile:

```sh
npm ci
npm run dev
```

```sh
npm run lint
npm test
npm run build
```

Production files are written to `dist/`.

## How commands stay correct

`npm test` runs three suites:

- `tests/command.test.ts`, `tests/config.test.ts` — command generation, option resolution, validation and share links.
- `tests/shell.test.ts` — passes quoted values through real Bash and PowerShell, when installed, and checks the exact arguments a program receives.
- `tests/upstream.test.ts` — when `tmp/upstream-ai-kit` holds the pinned AI-KIT checkout, runs 21 generated option sets through the real `scripts/install.py` preview (mode, preset, extras and the full list of writes must match the site's model) and 8 through `--apply` in temporary folders (the written `settings.json` must equal the preview, key order included). It also compares the flag reference with the options and choices in the installer's `--help` usage and checks that `doctor --fix` writes nothing, `--fix --apply` restores a removed file and `--apply` alone is refused.

To run the upstream checks locally:

```sh
git clone https://github.com/tigusigalpa/ai-kit.git tmp/upstream-ai-kit
git -C tmp/upstream-ai-kit checkout --detach 763bef0dfe600bac6b2a131d254061abcf0ffb6a
npm test
```

The file list model in `src/data/footprint.json` is generated from installer previews of an empty folder:

```sh
python -I scripts/footprint.py tmp/upstream-ai-kit > src/data/footprint.json
```

## Updating to a new AI-KIT release

1. Check out the new tag in `tmp/upstream-ai-kit` and review `scripts/install.py`, `scripts/doctor.py`, `integrations/agents.json` and `docs/guide/INSTALLER_FLAGS.md` for changes.
2. Update `src/data/upstream.ts` (set `imageVersion` only to an image tag that is actually published on Docker Hub), the catalog in `src/data/catalog.ts`, the flag rows in `src/components/Reference.tsx` and `AIKIT_COMMIT` in `.github/workflows/pages.yml`.
3. Regenerate `src/data/footprint.json` and run `npm run check`.

## Deployment

`.github/workflows/pages.yml` runs lint, all tests against the pinned AI-KIT release and the build on every push and pull request; pushes to `main` deploy `dist/` to GitHub Pages. The base path follows the repository name; set the repository variable `CUSTOM_DOMAIN` (or `SITE_URL`) to change the canonical URL.

This repository has no license file yet; the AI-KIT license covers the kit, not this site.
