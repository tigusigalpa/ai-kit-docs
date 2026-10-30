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

## Not verified

- Screen-reader walkthrough and a full keyboard-only pass.
- Safari and Firefox rendering; the dev pane is Chromium-based.
- The deployed GitHub Pages URL is checked after the first workflow run.
