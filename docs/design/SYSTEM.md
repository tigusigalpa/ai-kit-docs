# Project design system

Rules for the single-page site in `src/`. Use [BRIEF](BRIEF.md) for intent and [ACCEPTANCE](ACCEPTANCE.md) for evidence.

## Direction and scope

- Visual direction: "engineering notebook" — warm paper surface with a faint dot grid in the hero, ink typography, violet accent, lime highlight for success/apply, dark terminal panels for every command.
- Applicable routes: the whole page; components live in `src/components/`, tokens and layout in `src/styles.css`.
- External design system: none. TypeUI was not connected; this local system is the source of truth.

## Tokens and behavior

| Area | Chosen rules |
| --- | --- |
| Semantic colors and contrast/theme roles | CSS custom properties on `:root` (`--bg`, `--surface`, `--surface-2/3`, `--ink`, `--ink-2`, `--muted`, `--line`, `--accent`, `--accent-soft`, `--accent-text`, `--ok/warn/err/info` with `-soft` pairs, `--term-*` for code). Dark values apply for `prefers-color-scheme: dark` unless `data-theme="light"`, and for `data-theme="dark"`. Light accent `#5b3df5`, dark accent `#8f7bff`, lime `#d7ff5a` only on dark terminal surfaces. |
| Typography, supported scripts and type scale | Onest Variable (Latin + Cyrillic) for UI and headings, JetBrains Mono Variable for code, flags and eyebrows. H1 `clamp(40px, 5.4vw, 70px)` / -0.045em; H2 `clamp(30px, 3.7vw, 46px)`; body 16px; lead 19px; code 13–13.5px. |
| Containers, grid, breakpoints and responsive composition | Content width `min(1200px, 100% - 48px)`, 16px gutters below 720px. Breakpoints: 1180px (narrower result panel), 1040px (menu button, single-column hero/configurator, static result panel with a sticky "see commands" link), 720px (mobile spacing, stacked grids). `main` clips horizontal overflow. |
| Spacing, radii, borders and shadows | Section top padding 96px (72px mobile). Radii: 18px cards, 14px code blocks, 11–13px controls, pills fully rounded. 1px `--line` borders; three shadow levels `--shadow-sm/md/lg`. |
| Images/icons and asset provenance | Original inline SVG icons (`src/components/Icon.tsx`) at 1.7 stroke; logo is a context bracket holding a spark (`Logo`, `public/favicon.svg`). Client names are text only, no third-party logos. |
| Motion, reduced motion and feedback | Hero terminal lines and floating cards fade in once; disabled under `prefers-reduced-motion`, which also turns off smooth scrolling. Copy buttons confirm for ~2s with a live region. |

## Component contracts

- `CodeBlock` — `code`, optional `title`, `lang`, `step`, `tone` (`apply` highlights the write step, `muted` for setup/notes) and children as a note; always includes a copy button.
- `Segmented` — accessible radio group with hidden native inputs and `data-checked` styling.
- `RunnerPicker` — shared runner + shell choice; `compact` variant inside the configurator hides icons and hints.
- `Configurator` — owns no state; receives `Config` and emits changes. `ResultPanel` renders tabs (commands, settings.json, files), issues and share/reset actions.
- Domain logic stays in `src/domain/` (no React): `config.ts` (resolution, validation, settings preview), `command.ts` (runner launchers, quoting, Docker setup), `shell.ts`, `footprint.ts`, `share.ts`.

## Maintenance

Reuse these tokens for small changes; add a token before introducing a new colour. Keep one visual system for the page. Update this file when a component contract or token changes.
