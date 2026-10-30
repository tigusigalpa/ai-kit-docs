// Installer vocabulary of AI-KIT 1.4.5 (scripts/install.py and integrations/agents.json).
export type Text = readonly [english: string, russian: string];

export const AGENTS = ['codex', 'claude', 'cursor', 'copilot', 'gemini', 'windsurf', 'cline', 'roo', 'aider', 'kimi', 'manus'] as const;
export type Agent = typeof AGENTS[number];

export const AGENT_INFO: Record<Agent, { name: string; installs: Text; bootstrap?: string }> = {
  codex: { name: 'Codex', installs: ['AGENTS.md and .agents/skills/', 'AGENTS.md и .agents/skills/'], bootstrap: '$ai-kit-bootstrap' },
  claude: { name: 'Claude Code', installs: ['CLAUDE.md importing AGENTS, skills, settings, path-scoped .claude/rules/', 'CLAUDE.md с импортом AGENTS, skills, settings, .claude/rules/ по путям'], bootstrap: '/ai-kit-bootstrap' },
  cursor: { name: 'Cursor', installs: ['.cursor/rules/ with module globs, .cursorignore secrets', '.cursor/rules/ с glob модулей, секреты в .cursorignore'] },
  copilot: { name: 'GitHub Copilot', installs: ['copilot-instructions.md and per-module .instructions.md', 'copilot-instructions.md и .instructions.md по модулям'] },
  gemini: { name: 'Gemini CLI', installs: ['GEMINI.md and .geminiignore; reads the shared skills', 'GEMINI.md и .geminiignore; читает общие skills'] },
  windsurf: { name: 'Windsurf', installs: ['Native rule folder with glob-scoped module rules', 'Родная папка правил с правилами модулей по glob'] },
  cline: { name: 'Cline', installs: ['Native rule folder with path-scoped module rules', 'Родная папка правил с правилами модулей по путям'] },
  roo: { name: 'Roo', installs: ['Native rule folder', 'Родная папка правил'] },
  aider: { name: 'Aider', installs: ['CONVENTIONS.md and .aiderignore, plus model routing config', 'CONVENTIONS.md и .aiderignore, плюс конфиг маршрутизации моделей'] },
  kimi: { name: 'Kimi', installs: ['Short KIMI.md entry file', 'Короткий входной файл KIMI.md'] },
  manus: { name: 'Manus', installs: ['Short MANUS.md entry file', 'Короткий входной файл MANUS.md'] },
};

export const PRESET_EXTRAS = ['session-start', 'guards', 'data-guards', 'native-settings', 'scoped-rules'] as const;
export const MODULE_EXTRAS = ['ci', 'security-audit', 'strix', 'context7', 'web-design', 'orchestration'] as const;
// Order of EXTRA_SETTINGS_KEYS in install.py; settings.json keys follow it.
export const EXTRAS = ['session-start', 'guards', 'data-guards', 'native-settings', 'scoped-rules', 'ci', 'security-audit', 'strix', 'context7', 'web-design', 'orchestration'] as const;
export type Extra = typeof EXTRAS[number];

export const settingsKey = (extra: Extra) => extra.replaceAll('-', '_');

export const EXTRA_INFO: Record<Extra, { title: Text; adds: Text; note: Text; needs?: 'claude' | 'codex' }> = {
  'session-start': {
    title: ['Session start', 'Старт сессии'],
    adds: ['A session-start hook that reads project context and Git status when a chat begins.', 'Hook при старте сессии: читает контекст проекта и статус Git в начале чата.'],
    note: ['Claude must be selected for automatic hook wiring; the shell hook needs POSIX tools.', 'Для автоматического подключения hook нужен Claude; shell-hook требует POSIX-утилит.'],
    needs: 'claude',
  },
  guards: {
    title: ['Git guards', 'Git-guards'],
    adds: ['Claude confirmation rules before Git commit and push.', 'Правила Claude: подтверждение перед git commit и push.'],
    note: ['Claude must be selected for native wiring. Core already requires your explicit request for commits.', 'Нужен выбранный Claude. Core и так требует вашего явного запроса на коммит.'],
    needs: 'claude',
  },
  'data-guards': {
    title: ['Data guards', 'Data-guards'],
    adds: ['Ask before rm -rf, git reset --hard, git clean, Docker prune and detected framework migrations.', 'Запрос подтверждения перед rm -rf, git reset --hard, git clean, Docker prune и миграциями фреймворка.'],
    note: ['Claude client ask rules, not a universal sandbox.', 'Это ask-правила клиента Claude, а не универсальная песочница.'],
    needs: 'claude',
  },
  'native-settings': {
    title: ['Native settings', 'Родные настройки'],
    adds: ['Allow recorded test/lint/build commands, deny secret reads, write client ignore files.', 'Разрешает записанные команды test/lint/build, запрещает чтение секретов, пишет ignore-файлы клиентов.'],
    note: ['Claude permission entries need Claude; ignore files cover Cursor, Gemini and Aider.', 'Права Claude требуют Claude; ignore-файлы — для Cursor, Gemini и Aider.'],
  },
  'scoped-rules': {
    title: ['Scoped rules', 'Правила по модулям'],
    adds: ['Path-scoped module rules for clients with a scoped format (Claude, Cursor, Copilot, Windsurf, Cline).', 'Правила модулей по путям для клиентов с таким форматом (Claude, Cursor, Copilot, Windsurf, Cline).'],
    note: ['Generated from the module map; rerun after reviewed module-map changes.', 'Строятся по карте модулей; перезапускайте после её изменений.'],
  },
  ci: {
    title: ['CI workflow', 'CI workflow'],
    adds: ['.github/workflows/ai-kit.yml for AI-KIT installation-health checks.', '.github/workflows/ai-kit.yml для проверки состояния установки AI-KIT.'],
    note: ['Team mode is the intended companion. Does not run your application test suite.', 'Рассчитан на режим team. Не запускает тесты вашего приложения.'],
  },
  'security-audit': {
    title: ['Cloudflare security-audit', 'Cloudflare security-audit'],
    adds: ['Pinned audit method: reconnaissance, hunting, evidence validation, coverage and reporting.', 'Закреплённая методика аудита: разведка, поиск, проверка доказательств, покрытие и отчёт.'],
    note: ['Invoke explicitly with $security-audit or /security-audit. Installing starts no audit.', 'Вызывается явно: $security-audit или /security-audit. Установка аудит не запускает.'],
  },
  strix: {
    title: ['Strix', 'Strix'],
    adds: ['Nine pinned Strix skills for code, web, API and OWASP testing plus a user-invoked entry point.', 'Девять закреплённых skills Strix для тестов кода, web, API и OWASP плюс точка входа.'],
    note: ['Strix CLI, Docker, model access and authorized targets are configured separately.', 'Strix CLI, Docker, доступ к модели и разрешённые цели настраиваются отдельно.'],
  },
  context7: {
    title: ['Context7', 'Context7'],
    adds: ['Version-aware library documentation lookup and the context7-docs skill.', 'Поиск документации библиотек с учётом версий и skill context7-docs.'],
    note: ['MCP server registration and authentication are separate.', 'Регистрация MCP-сервера и аутентификация — отдельно.'],
  },
  'web-design': {
    title: ['Web Design', 'Web Design'],
    adds: ['Brief → design system → stack-aware implementation → recorded UI acceptance, with a Blade route.', 'Бриф → дизайн-система → реализация под стек → зафиксированная приёмка UI, есть маршрут для Blade.'],
    note: ['Creates docs/design/ BRIEF, SYSTEM and ACCEPTANCE when missing; external tools stay separate.', 'Создаёт docs/design/ BRIEF, SYSTEM и ACCEPTANCE, если их нет; внешние инструменты — отдельно.'],
  },
  orchestration: {
    title: ['Orchestration', 'Оркестрация'],
    adds: ['Codex helper agents and a disabled-by-default bounded OpenRouter executor.', 'Агенты-помощники Codex и отключённый по умолчанию OpenRouter-исполнитель с лимитами.'],
    note: ['Codex must be selected for native helpers. Installation launches no agents or paid calls.', 'Для родных помощников нужен Codex. Установка не запускает агентов и платных вызовов.'],
    needs: 'codex',
  },
};

export const PRESETS = ['minimal', 'solo', 'team', 'strict'] as const;
export type Preset = typeof PRESETS[number];
export type Mode = 'private' | 'team';

export const PRESET_INFO: Record<Preset, { mode: Mode | null; extras: readonly Extra[]; summary: Text }> = {
  minimal: { mode: null, extras: [], summary: ['Turns the five preset-managed extras off; keeps saved mode.', 'Выключает пять extras пресетов; сохраняет режим.'] },
  solo: { mode: 'private', extras: ['session-start', 'native-settings', 'scoped-rules'], summary: ['Private. Session start, native settings, scoped rules.', 'Private. Старт сессии, родные настройки, правила по модулям.'] },
  team: { mode: 'team', extras: ['session-start', 'guards', 'native-settings', 'scoped-rules'], summary: ['Team. The solo extras plus Git commit/push confirmation.', 'Team. Всё из solo плюс подтверждение commit/push.'] },
  strict: { mode: null, extras: PRESET_EXTRAS, summary: ['All five: session start, Git and data guards, settings, rules.', 'Все пять: старт, Git- и data-guards, настройки, правила.'] },
};

export const STACKS = ['Go', 'PHP', 'Laravel', 'Filament 5', 'Moodle', 'Python', 'Frontend', 'Library/SDK', 'Rust', '.NET', 'Java', 'Terraform/Helm'] as const;

export const LANGUAGE_SUGGESTIONS = ['Russian', 'English', 'Ukrainian', 'German', 'Spanish', 'French', 'Portuguese', 'Italian', 'Polish', 'Turkish', 'Chinese', 'Japanese', 'Korean'];
