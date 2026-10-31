import { CLEANUP_AND_FIX_PREVIEW, imageAtLeast, UPSTREAM } from '../data/upstream';
import { PRESET_INFO } from '../data/catalog';
import { allowsDowngrade, isAbsolutePath, resolve, sortAgents, type Config, type Runner } from './config';
import { hasControlCharacters, literal, quote, type Shell } from './shell';

export type Mount = 'none' | 'readonly' | 'writable';

const python = (shell: Shell) => shell === 'powershell' ? 'python' : 'python3';

/** The project path as the CLI sees it: Docker always works on the mounted /workspace. */
export const targetToken = (runner: Runner, target: string, shell: Shell) => runner === 'docker' ? '/workspace' : quote(target.trim() || '.', shell);

/** Prefix that launches `aikit <command>` for a runner. */
function launcher(runner: Runner, shell: Shell, command: string, mount: Mount, interactive: boolean): string {
  switch (runner) {
    case 'aikit': return `aikit ${command}`;
    case 'module': return `${python(shell)} -m aikit.aikit_cli ${command}`;
    case 'venv': return shell === 'powershell' ? `& "$cliEnv\\Scripts\\aikit.exe" ${command}` : `"$cli_env/bin/aikit" ${command}`;
    case 'source': return command === 'install' ? `${python(shell)} scripts/install.py` : `${python(shell)} aikit_cli.py ${command}`;
    case 'docker': {
      const runtime = shell === 'powershell' ? '@runtime' : '"${runtime[@]}"';
      const source = shell === 'powershell' ? '$appPath' : '$app_path';
      const image = shell === 'powershell' ? '$image' : '"$image"';
      const mountArg = mount === 'none' ? '' : ` --mount "type=bind,source=${source},target=/workspace${mount === 'readonly' ? ',readonly' : ''}"`;
      return `docker run ${runtime}${interactive ? ' -it' : ''}${mountArg} ${image} ${command}`;
    }
  }
}

export const invocation = (runner: Runner, shell: Shell, command: string, args: readonly string[], mount: Mount = 'none', interactive = false) =>
  [launcher(runner, shell, command, mount, interactive), ...args].join(' ').trim();

/** Raw installer options after TARGET, shared by preview and apply. */
export function installOptions(config: Config): string[] {
  const resolved = resolve(config);
  const args: string[] = [];
  if (config.preset) args.push('--preset', config.preset);
  // A mode equal to the preset's own mode adds nothing; any other explicit mode wins over the preset.
  if (config.mode && config.mode !== (config.preset ? PRESET_INFO[config.preset].mode : null)) args.push('--mode', config.mode);
  for (const agent of sortAgents(config.agents)) args.push('--agent', agent);
  if (config.chatLanguage.trim()) args.push('--chat-language', config.chatLanguage);
  if (config.conventions) args.push('--conventions', config.conventions);
  if (config.dockerCleanup) args.push('--docker-cleanup', config.dockerCleanup);
  for (const extra of resolved.extraFlags) args.push(`--with-${extra}`);
  for (const path of config.acceptLocal.map(value => value.trim()).filter(Boolean)) args.push('--accept-local', path);
  if (allowsDowngrade(config)) args.push('--allow-downgrade');
  if (config.interactive) args.push('--interactive');
  return args;
}

/** Installer arguments quoted for the shell, starting with TARGET. */
export const installArgs = (config: Config, runner: Runner, shell: Shell) =>
  [targetToken(runner, config.target, shell), ...installOptions(config).map(arg => quote(arg, shell))];

export function installCommand(config: Config, runner: Runner, shell: Shell, phase: 'preview' | 'apply'): string {
  const args = installArgs(config, runner, shell);
  if (phase === 'apply') args.push('--apply', ...(config.check ? ['--check'] : []));
  return invocation(runner, shell, 'install', args, phase === 'apply' ? 'writable' : 'readonly', config.interactive);
}

/** Session variables a runner needs before its commands work in a fresh terminal. */
export function sessionSetup(runner: Runner, shell: Shell, target: string): string | null {
  if (runner === 'venv') {
    return shell === 'powershell' ? `$cliEnv = Join-Path $env:LOCALAPPDATA 'AI-KIT\\venv'` : `cli_env="$HOME/.local/share/ai-kit/venv"`;
  }
  if (runner !== 'docker') return null;
  const path = target.trim() || '.';
  if (shell === 'powershell') {
    return [
      `$appPath = (Resolve-Path -LiteralPath ${literal(path, shell)}).Path`,
      `$image = '${UPSTREAM.image}'`,
      `$runtime = @('--rm', '--init', '--network', 'none', '--read-only', '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges', '--tmpfs', '/tmp:rw,nosuid,nodev,size=256m')`,
    ].join('\n');
  }
  return [
    `app_path="$(cd ${quote(path, shell)} && pwd)"`,
    `image='${UPSTREAM.image}'`,
    `runtime=(--rm --init --network none --read-only --cap-drop ALL --security-opt no-new-privileges --tmpfs /tmp:rw,nosuid,nodev,size=256m --user "$(id -u):$(id -g)")`,
  ].join('\n');
}

/** Refresh the CLI itself before updating an installed project. */
export function upgradeCommand(runner: Runner, shell: Shell): string {
  switch (runner) {
    case 'aikit': return shell === 'powershell' ? `python -m pip install --upgrade ${UPSTREAM.package}` : `pipx upgrade ${UPSTREAM.package}`;
    case 'module': return `${python(shell)} -m pip install --upgrade ${UPSTREAM.package}`;
    case 'venv': return shell === 'powershell'
      ? `& "$cliEnv\\Scripts\\python.exe" -m pip install --upgrade ${UPSTREAM.package}`
      : `"$cli_env/bin/python" -m pip install --upgrade ${UPSTREAM.package}`;
    case 'docker': return `docker pull ${UPSTREAM.image}`;
    case 'source': return `git fetch --tags\ngit checkout ${UPSTREAM.tag}`;
  }
}

export const versionCommand = (runner: Runner, shell: Shell) => runner === 'source'
  ? `${python(shell)} aikit_cli.py --version`
  : invocation(runner, shell, '--version', []);

/**
 * doctor --fix as two steps: preview the repair plan (writes nothing), then write it with --fix --apply.
 * An image older than that preview applies --fix directly and rejects --apply; for it the preview is
 * the installer preview without options, which builds the same repair plan from the saved choices.
 */
export function doctorFix(runner: Runner, shell: Shell, target: string, image: string = UPSTREAM.imageVersion) {
  const project = targetToken(runner, target, shell);
  const legacyImage = runner === 'docker' && !imageAtLeast(CLEANUP_AND_FIX_PREVIEW, image);
  return legacyImage
    ? { legacyImage, preview: invocation(runner, shell, 'install', [project], 'readonly'), apply: invocation(runner, shell, 'doctor', [project, '--fix'], 'writable') }
    : { legacyImage, preview: invocation(runner, shell, 'doctor', [project, '--fix'], 'readonly'), apply: invocation(runner, shell, 'doctor', [project, '--fix', '--apply'], 'writable') };
}

/** Read-only MCP server inventory of the project; Docker mounts it read-only. */
export const mcpReport = (runner: Runner, shell: Shell, target: string) =>
  invocation(runner, shell, 'mcp report', [targetToken(runner, target, shell)], 'readonly');

/**
 * Installer option schema. Without `output` it prints JSON; with it, --output writes the file with LF line endings.
 * Docker writes into the writable /workspace mount, so its output path must stay inside the mounted folder.
 */
export function flagsCommand(runner: Runner, shell: Shell, output?: string) {
  const path = output?.trim();
  if (!path) return invocation(runner, shell, 'flags', []);
  if (runner !== 'docker') return invocation(runner, shell, 'flags', ['--output', quote(path, shell)]);
  const inside = path.replaceAll('\\', '/').replace(/^(\.\/)+/, '');
  return invocation(runner, shell, 'flags', ['--output', quote(`/workspace/${inside}`, shell)], 'writable');
}

/** Why an `aikit flags --output` path cannot be used, or null when it can. */
export function flagsOutputProblem(runner: Runner, shell: Shell, output: string): 'empty' | 'invalid' | 'docker-path' | 'powershell-quote' | null {
  const path = output.trim();
  if (!path) return 'empty';
  // A file name is required: not an option-like word, a bare folder or a path ending in a separator.
  if (hasControlCharacters(path) || path.startsWith('-') || /(^|[\\/])\.{0,2}$/.test(path)) return 'invalid';
  if (runner === 'docker' && (isAbsolutePath(path) || path.split(/[\\/]/).includes('..'))) return 'docker-path';
  if (shell === 'powershell' && path.includes('"')) return 'powershell-quote';
  return null;
}
