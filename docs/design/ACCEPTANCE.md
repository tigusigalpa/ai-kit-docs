# UI acceptance

Requirements and observed evidence for the scope in [BRIEF](BRIEF.md) and rules in [SYSTEM](SYSTEM.md).

## Required states

- Configurator: new installation and update scenarios; each of five runners on PowerShell and Bash; preset, mode, client and module combinations; validation errors block command output; warnings and notes stay visible.
- Result tabs: commands, `settings.json`, file tree.
- Share link: opening a link restores the configuration and lands on the configurator.
- Themes: light and dark; languages: English and Russian.
- Viewports: 375px phone, 1440px desktop.

## Evidence — 2026-10-30, local Vite dev server in the Claude desktop browser pane

| Check | Result |
| --- | --- |
| Hero, install guide, configurator, commands, features, reference, FAQ, footer at 1440×900 (Russian, light) | Rendered; fixed during review: hero grid overflow, JSON in hero terminal collapsed to one line, inline-code styles leaking into code blocks, horizontal page shift caused by the hero background, clipped runner labels |
| Configurator interactions: team preset, Docker runner, Web Design module, Files tab | Commands, Docker setup and tree (104 files, `.claude/settings.json` for team) as expected |
| Update scenario via share link (`python -m`, Bash, English, Context7 + Strix) | Upgrade step plus minimal preview/apply commands; no issues |
| Dark theme and English | Rendered with correct contrast for language toggle, terminal and panels |
| 375×812 phone | No element overflows the viewport; menu button, two-column clients, sticky "See the generated commands" link |
| Browser console | No errors |
| Automated: `npm run check` | ESLint clean; 67 Vitest tests (unit, Bash and Windows PowerShell 5.1 quoting, 21 previews and 8 applies through the real AI-KIT 1.4.5 installer); production build succeeds |
| GitHub Actions run 41102098679 (ubuntu-latest) | Lint, all tests including upstream installer and Bash/pwsh quoting, Pages build and deploy succeeded |
| Deployed <https://tigusigalpa.github.io/ai-kit-docs/> | HTTP 200; canonical URL and `/ai-kit-docs/` asset paths correct; bundled fonts load; a share link restores the configuration and scrolls to the configurator |

## Evidence — 2026-10-30, AI-KIT 1.4.6 update, local `vite preview` of the production build in the Claude desktop browser pane

The Vite dev server could not re-optimize dependencies inside the Dropbox folder (`EBUSY` on `node_modules/.vite`), so the built `dist/` was checked instead.

| Check | Result |
| --- | --- |
| Configurator group 04, Docker cleanup control (English, 800px pane) | Default (maximum) / maximum / keep-cache; hint follows the choice; keep-cache adds `--docker-cleanup keep-cache` to preview and apply; `settings.json` shows `docker_cleanup` after `conventions` |
| Docker runner with keep-cache, then default | Error blocks commands and the control gets the error border; with the default an info note explains image 1.4.5; commands keep `tigusigalpa/ai-kit:1.4.5` |
| More commands, doctor with `--fix` (Russian; `aikit` and Docker runners) | Two steps: `doctor . --fix` preview and `--fix --apply`; Docker uses `install /workspace` read-only preview and `doctor /workspace --fix` writable, with notes |
| Reference, release chip and note, guide links (Russian) | 24 / 24 flags including `--docker-cleanup`; chip "v1.4.6 релиз на GitHub 2026-10-30 · Docker-образ 1.4.5"; links open `docs/guide/` at `v1.4.6` |
| 375×812 phone, update scenario via share link with `cleanup=keep-cache` | Control wraps to two rows inside the card; page scroll width equals the viewport; commands `aikit install . --docker-cleanup keep-cache` |
| Browser console | No errors on the production build |
| Automated: `npm run check` | ESLint clean; 75 Vitest tests (21 previews, 8 applies, flag/`--help` comparison and `doctor --fix` behavior through the real AI-KIT 1.4.6 checkout); production build succeeds |

Not re-checked in this update: dark theme, screenshots of every state (the pane was hidden, so most checks read the DOM), GitHub Actions and the deployed site.

## Evidence — 2026-10-31, AI-KIT 1.5.0 update

Required states added by this update:

- Update scenario, Advanced group: `--allow-downgrade` is offered only there, off by default, with a warning issue when on; it reaches preview and apply and appears in a share link only when set.
- More commands: `mcp report` (Docker: read-only mount) and `flags` with and without `--output` (Docker: writable mount, path under `/workspace`), notes in English and Russian; doctor notes mention the upgrade hints and the downgrade refusal.
- Docker runner with image 1.5.0: `--docker-cleanup` is accepted and `doctor --fix` uses the preview plus `--fix --apply`; no image-version notes appear.
- Reference: 25 / 25 flags including `--allow-downgrade`, and the `installer-flags.json` note and link.

| Check | Result |
| --- | --- |
| Automated: `npm run check` | ESLint clean; 86 Vitest tests (21 previews, 8 applies, flag comparison with `--help` and `installer-flags.json`, `aikit flags`, `aikit mcp report`, `doctor --fix` and the downgrade guard through the real AI-KIT 1.5.0 release commit); production build succeeds |

Not checked in this update: rendering of the states above in a browser (light/dark, English/Russian, 375px phone), GitHub Actions and the deployed site.

## Not verified

- Screen-reader walkthrough and a full keyboard-only pass.
- Safari and Firefox rendering; checks used a Chromium-based browser.
