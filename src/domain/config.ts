import { AGENTS, EXTRAS, LEGACY_AGENTS, PRESET_EXTRAS, PRESET_INFO, settingsKey, TEMPLATE_EXTRAS, type Agent, type DockerCleanup, type Extra, type Mode, type Preset } from '../data/catalog';
import { imageAtLeast, OPTION_SINCE, UPSTREAM } from '../data/upstream';
import { hasControlCharacters, type Shell } from './shell';

export const RUNNERS = ['aikit', 'module', 'venv', 'docker', 'source'] as const;
export type Runner = typeof RUNNERS[number];
export type Scenario = 'fresh' | 'update';
export type Conventions = 'owner' | 'standard';

export interface Config {
  scenario: Scenario;
  target: string;
  preset: Preset | '';
  mode: Mode | '';
  agents: Agent[];
  chatLanguage: string;
  conventions: Conventions | '';
  dockerCleanup: DockerCleanup | '';
  extras: Extra[];
  interactive: boolean;
  check: boolean;
  acceptLocal: string[];
  /** --allow-downgrade: offered only when updating a project. */
  allowDowngrade: boolean;
}

export const freshDefaults = (): Config => ({
  scenario: 'fresh', target: '.', preset: 'solo', mode: '', agents: ['codex', 'claude'], chatLanguage: '',
  conventions: '', dockerCleanup: '', extras: [], interactive: false, check: true, acceptLocal: [], allowDowngrade: false,
});

export const updateDefaults = (): Config => ({ ...freshDefaults(), scenario: 'update', preset: '', agents: [] });

/** Whether this run passes --allow-downgrade; a new installation has no newer version to protect. */
export const allowsDowngrade = (config: Config) => config.allowDowngrade && config.scenario === 'update';

export const sortAgents = (agents: Iterable<Agent>) => AGENTS.filter(agent => new Set(agents).has(agent));
export const sortExtras = (extras: Iterable<Extra>) => EXTRAS.filter(extra => new Set(extras).has(extra));

export interface Resolved {
  /** Mode the installer will use; null when it keeps a saved value we cannot see. */
  mode: Mode | null;
  modeSource: 'flag' | 'preset' | 'default' | 'saved';
  /** Agents the installer will use; null means the saved selection of an existing installation. */
  agents: Agent[] | null;
  chatLanguage: string | null;
  conventions: Conventions | null;
  /** Docker cleanup mode; null keeps the saved value (an absent setting means maximum). */
  dockerCleanup: DockerCleanup | null;
  /** Extras enabled by this run: explicit flags plus preset bundle. */
  extras: Extra[];
  presetExtras: readonly Extra[];
  /** Preset-managed extras this run turns off unless they were explicit. */
  presetDisabled: Extra[];
  /** Explicit --with-* flags that are not already covered by the preset. */
  extraFlags: Extra[];
}

export function resolve(config: Config): Resolved {
  const preset = config.preset ? PRESET_INFO[config.preset] : null;
  const presetExtras = preset?.extras ?? [];
  const fresh = config.scenario === 'fresh';
  let mode: Mode | null = null;
  let modeSource: Resolved['modeSource'] = 'saved';
  if (config.mode) { mode = config.mode; modeSource = 'flag'; }
  else if (preset?.mode) { mode = preset.mode; modeSource = 'preset'; }
  else if (fresh) { mode = 'private'; modeSource = 'default'; }
  const extraFlags = sortExtras(config.extras.filter(extra => !presetExtras.includes(extra)));
  const extras = sortExtras([...presetExtras, ...config.extras]);
  const presetDisabled = preset ? PRESET_EXTRAS.filter(extra => !extras.includes(extra)) : [];
  return {
    mode, modeSource,
    agents: config.agents.length ? sortAgents(config.agents) : fresh ? ['codex'] : null,
    chatLanguage: config.chatLanguage.trim() ? config.chatLanguage : fresh ? 'English' : null,
    conventions: config.conventions || (fresh ? 'owner' : null),
    dockerCleanup: config.dockerCleanup || (fresh ? 'maximum' : null),
    extras, presetExtras, presetDisabled, extraFlags,
  };
}

/** ai-kit/settings.json after a fresh apply, in the key order install.py writes. */
export function settingsPreview(config: Config): Record<string, unknown> {
  const resolved = resolve(config);
  const settings: Record<string, unknown> = {
    project_language: 'English',
    chat_language: resolved.chatLanguage ?? 'English',
    // The settings template holds these keys as false; enabling them keeps their position.
    ...Object.fromEntries(TEMPLATE_EXTRAS.map(extra => [settingsKey(extra), resolved.extras.includes(extra)])),
    sharing_mode: resolved.mode ?? 'private',
    conventions: resolved.conventions ?? 'owner',
    docker_cleanup: resolved.dockerCleanup ?? 'maximum',
    upstream: { url: 'https://github.com/tigusigalpa/ai-kit', ref: 'main', source_directory: 'template' },
  };
  for (const extra of EXTRAS.filter(item => !TEMPLATE_EXTRAS.includes(item))) {
    const managed = config.preset !== '' && (PRESET_EXTRAS as readonly Extra[]).includes(extra);
    if (managed || resolved.extras.includes(extra)) settings[settingsKey(extra)] = resolved.extras.includes(extra);
  }
  return settings;
}

export type Severity = 'error' | 'warning' | 'info';
export interface Issue { severity: Severity; code: string; field?: string; detail?: string }

export const isAbsolutePath = (path: string) => /^(?:[A-Za-z]:[\\/]|\\\\|\/|~\/)/.test(path) || path === '~';

/** `image` is the Docker image the commands use; tests pass an older tag to check a lagging image. */
export function validate(config: Config, runner: Runner, shell: Shell, image: string = UPSTREAM.imageVersion): Issue[] {
  const issues: Issue[] = [];
  const resolved = resolve(config);
  const target = config.target.trim();
  if (!target) issues.push({ severity: 'error', code: 'target-empty', field: 'target' });
  else if (hasControlCharacters(target)) issues.push({ severity: 'error', code: 'control', field: 'target' });
  else {
    if (runner === 'source' && !isAbsolutePath(target)) issues.push({ severity: 'error', code: 'source-target', field: 'target' });
    if (shell === 'powershell' && target.startsWith('~')) issues.push({ severity: 'warning', code: 'powershell-tilde', field: 'target' });
    if (shell === 'posix' && /^[A-Za-z]:[\\/]/.test(target)) issues.push({ severity: 'warning', code: 'windows-path-posix', field: 'target' });
    if (shell === 'powershell' && target.startsWith('/') && runner !== 'docker') issues.push({ severity: 'warning', code: 'posix-path-powershell', field: 'target' });
    if (runner === 'docker' && target === '~') issues.push({ severity: 'warning', code: 'docker-home', field: 'target' });
  }
  const language = config.chatLanguage;
  if (language && (!language.trim() || language.length > 60 || hasControlCharacters(language) || language.trimStart().startsWith('-'))) {
    issues.push({ severity: 'error', code: 'chat-language', field: 'chatLanguage' });
  }
  config.acceptLocal.forEach((path, index) => {
    const value = path.trim();
    if (!value || hasControlCharacters(value) || value.startsWith('-') || isAbsolutePath(value) || value.split(/[\\/]/).includes('..')) {
      issues.push({ severity: 'error', code: 'accept-local', field: 'acceptLocal', detail: String(index + 1) });
    } else if (value.replaceAll('\\', '/') === 'ai-kit/settings.json') {
      issues.push({ severity: 'error', code: 'accept-settings', field: 'acceptLocal', detail: String(index + 1) });
    }
  });
  // Windows PowerShell 5.1 drops embedded double quotes when it passes arguments to native programs.
  if (shell === 'powershell' && [config.target, config.chatLanguage, ...config.acceptLocal].some(value => value.includes('"'))) {
    issues.push({ severity: 'error', code: 'powershell-quote' });
  }
  if (config.acceptLocal.length && config.scenario === 'fresh') issues.push({ severity: 'info', code: 'accept-fresh' });
  const agents = resolved.agents;
  if (agents) {
    const claudeNeeded = resolved.extras.filter(extra => ['session-start', 'guards', 'data-guards', 'claude-github'].includes(extra));
    if (claudeNeeded.length && !agents.includes('claude')) issues.push({ severity: 'warning', code: 'needs-claude', detail: claudeNeeded.join(', ') });
    if (resolved.extras.includes('native-settings') && !agents.some(agent => ['claude', 'cursor', 'gemini', 'aider'].includes(agent))) {
      issues.push({ severity: 'warning', code: 'native-settings-clients' });
    }
    if (resolved.extras.includes('scoped-rules') && !agents.some(agent => ['claude', 'cursor', 'copilot', 'devin', 'windsurf', 'cline'].includes(agent))) {
      issues.push({ severity: 'warning', code: 'scoped-rules-clients' });
    }
    if (resolved.extras.includes('orchestration') && !agents.includes('codex')) issues.push({ severity: 'warning', code: 'needs-codex' });
    // Devin loads both .devin/rules/ and the legacy .windsurf/rules/, so selecting both duplicates guidance.
    if (agents.includes('devin') && agents.includes('windsurf')) issues.push({ severity: 'info', code: 'devin-and-windsurf' });
    else if (agents.some(agent => LEGACY_AGENTS.includes(agent))) issues.push({ severity: 'info', code: 'windsurf-legacy' });
  }
  if (config.scenario === 'update' && config.agents.length) issues.push({ severity: 'info', code: 'agents-replace' });
  if (config.scenario === 'update' && resolved.presetDisabled.length) issues.push({ severity: 'info', code: 'preset-disables', detail: resolved.presetDisabled.join(', ') });
  if (config.preset && config.mode && PRESET_INFO[config.preset].mode && config.mode !== PRESET_INFO[config.preset].mode) {
    issues.push({ severity: 'info', code: 'mode-overrides-preset' });
  }
  if (resolved.extras.includes('ci') && resolved.mode === 'private') issues.push({ severity: 'info', code: 'ci-private' });
  if (allowsDowngrade(config)) issues.push({ severity: 'warning', code: 'allow-downgrade' });
  if (config.interactive && runner === 'docker') issues.push({ severity: 'info', code: 'docker-interactive' });
  // The published image can be older than the pinned release; argparse rejects options it does not know.
  if (runner === 'docker') {
    if (!imageAtLeast(UPSTREAM.version, image)) issues.push({ severity: 'info', code: 'docker-image' });
    const gated: [option: string, used: boolean, field: keyof Config][] = [
      ['--docker-cleanup', Boolean(config.dockerCleanup), 'dockerCleanup'],
      ['--allow-downgrade', allowsDowngrade(config), 'allowDowngrade'],
      ['--with-uuid', resolved.extraFlags.includes('uuid'), 'extras'],
      ['--with-claude-github', resolved.extraFlags.includes('claude-github'), 'extras'],
      ['--agent devin', config.agents.includes('devin'), 'agents'],
    ];
    for (const [option, used, field] of gated) {
      if (used && !imageAtLeast(OPTION_SINCE[option], image)) issues.push({ severity: 'error', code: 'docker-option-image', field, detail: option });
    }
  }
  return issues;
}

export const hasErrors = (issues: Issue[]) => issues.some(issue => issue.severity === 'error');
