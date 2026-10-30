import { UPSTREAM } from '../data/upstream';
import { PRESET_INFO } from '../data/catalog';
import { resolve, sortAgents, type Config, type Runner } from './config';
import { literal, quote, type Shell } from './shell';

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
  for (const extra of resolved.extraFlags) args.push(`--with-${extra}`);
  for (const path of config.acceptLocal.map(value => value.trim()).filter(Boolean)) args.push('--accept-local', path);
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
