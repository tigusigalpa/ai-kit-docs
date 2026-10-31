import { describe, expect, it } from 'vitest';
import { doctorFix, flagsCommand, flagsOutputProblem, installCommand, installOptions, invocation, mcpReport, sessionSetup, upgradeCommand } from '../src/domain/command';
import { UPSTREAM } from '../src/data/upstream';
import { freshDefaults, updateDefaults, type Config } from '../src/domain/config';
import { quote } from '../src/domain/shell';

const config = (patch: Partial<Config> = {}): Config => ({ ...freshDefaults(), ...patch });

describe('install commands', () => {
  it('matches the README quick start by default', () => {
    expect(installCommand(config(), 'aikit', 'posix', 'preview')).toBe('aikit install . --preset solo --agent codex --agent claude');
    expect(installCommand(config(), 'aikit', 'posix', 'apply')).toBe('aikit install . --preset solo --agent codex --agent claude --apply --check');
  });

  it('omits --check when disabled and never adds it to the preview', () => {
    expect(installCommand(config({ check: false }), 'aikit', 'posix', 'apply')).toBe('aikit install . --preset solo --agent codex --agent claude --apply');
  });

  it('emits options in a stable order with repeated flags', () => {
    const value = config({ preset: 'team', mode: 'private', agents: ['claude', 'codex', 'cursor'], chatLanguage: 'English', conventions: 'standard', extras: ['web-design', 'guards', 'context7'], interactive: true });
    expect(installOptions(value)).toEqual(['--preset', 'team', '--mode', 'private', '--agent', 'codex', '--agent', 'claude', '--agent', 'cursor',
      '--chat-language', 'English', '--conventions', 'standard', '--with-context7', '--with-web-design', '--interactive']);
  });

  it('emits --docker-cleanup only for an explicit choice, after the conventions', () => {
    expect(installOptions(config())).not.toContain('--docker-cleanup');
    expect(installOptions(config({ preset: '', agents: [], conventions: 'owner', dockerCleanup: 'keep-cache' }))).toEqual(['--conventions', 'owner', '--docker-cleanup', 'keep-cache']);
    expect(installCommand({ ...updateDefaults(), dockerCleanup: 'maximum' }, 'aikit', 'posix', 'apply')).toBe('aikit install . --docker-cleanup maximum --apply --check');
  });

  it('passes --allow-downgrade only for an update, in preview and apply', () => {
    expect(installOptions(config({ allowDowngrade: true }))).not.toContain('--allow-downgrade');
    const update = { ...updateDefaults(), acceptLocal: ['AGENTS.md'], allowDowngrade: true, interactive: true };
    expect(installOptions(update)).toEqual(['--accept-local', 'AGENTS.md', '--allow-downgrade', '--interactive']);
    expect(installCommand({ ...updateDefaults(), allowDowngrade: true }, 'aikit', 'posix', 'preview')).toBe('aikit install . --allow-downgrade');
    expect(installCommand({ ...updateDefaults(), allowDowngrade: true }, 'aikit', 'posix', 'apply')).toBe('aikit install . --allow-downgrade --apply --check');
  });

  it('drops a mode equal to the preset mode and extras the preset already enables', () => {
    expect(installOptions(config({ preset: 'solo', mode: 'private', extras: ['session-start', 'ci'] }))).toEqual(['--preset', 'solo', '--agent', 'codex', '--agent', 'claude', '--with-ci']);
  });

  it('keeps an update minimal so saved choices are preserved', () => {
    expect(installCommand(updateDefaults(), 'module', 'powershell', 'apply')).toBe('python -m aikit.aikit_cli install . --apply --check');
  });

  it('quotes paths and values per shell', () => {
    const value = config({ target: 'C:\\Projects\\Client Site', chatLanguage: "O'Brien English", preset: '', agents: [] });
    expect(installCommand(value, 'aikit', 'powershell', 'preview')).toBe("aikit install 'C:\\Projects\\Client Site' --chat-language 'O''Brien English'");
    expect(installCommand({ ...value, target: '~/my apps/site' }, 'aikit', 'posix', 'preview')).toBe("aikit install ~/'my apps/site' --chat-language 'O'\\''Brien English'");
  });

  it('builds runner-specific launchers', () => {
    const value = config({ preset: '', agents: [] });
    expect(installCommand(value, 'module', 'posix', 'preview')).toBe('python3 -m aikit.aikit_cli install .');
    expect(installCommand(value, 'venv', 'powershell', 'preview')).toBe('& "$cliEnv\\Scripts\\aikit.exe" install .');
    expect(installCommand(value, 'venv', 'posix', 'preview')).toBe('"$cli_env/bin/aikit" install .');
    expect(installCommand({ ...value, target: '/srv/app' }, 'source', 'posix', 'preview')).toBe('python3 scripts/install.py /srv/app');
    expect(invocation('source', 'posix', 'doctor', ['/srv/app'])).toBe('python3 aikit_cli.py doctor /srv/app');
  });

  it('mounts read-only for preview and writable for apply in Docker', () => {
    const value = config({ agents: ['codex'], preset: '', extras: ['web-design'] });
    expect(installCommand(value, 'docker', 'powershell', 'preview')).toBe(
      'docker run @runtime --mount "type=bind,source=$appPath,target=/workspace,readonly" $image install /workspace --agent codex --with-web-design');
    expect(installCommand(value, 'docker', 'posix', 'apply')).toBe(
      'docker run "${runtime[@]}" --mount "type=bind,source=$app_path,target=/workspace" "$image" install /workspace --agent codex --with-web-design --apply --check');
    expect(installCommand({ ...value, interactive: true }, 'docker', 'posix', 'preview')).toContain('docker run "${runtime[@]}" -it --mount');
  });

  it('previews a doctor repair plan before writing it', () => {
    expect(doctorFix('aikit', 'posix', '.')).toEqual({ legacyImage: false, preview: 'aikit doctor . --fix', apply: 'aikit doctor . --fix --apply' });
    expect(doctorFix('module', 'powershell', 'C:\\My App').apply).toBe("python -m aikit.aikit_cli doctor 'C:\\My App' --fix --apply");
    expect(doctorFix('source', 'posix', '/srv/app').preview).toBe('python3 aikit_cli.py doctor /srv/app --fix');
  });

  it('uses commands the Docker image accepts for the doctor repair', () => {
    expect(UPSTREAM.image).toBe(`tigusigalpa/ai-kit:${UPSTREAM.imageVersion}`);
    expect(doctorFix('docker', 'posix', '.')).toEqual({
      legacyImage: false,
      preview: 'docker run "${runtime[@]}" --mount "type=bind,source=$app_path,target=/workspace,readonly" "$image" doctor /workspace --fix',
      apply: 'docker run "${runtime[@]}" --mount "type=bind,source=$app_path,target=/workspace" "$image" doctor /workspace --fix --apply',
    });
    // An image older than 1.4.6 applies --fix directly and rejects --apply; its installer preview shows the same plan.
    expect(doctorFix('docker', 'posix', '.', '1.4.5')).toEqual({
      legacyImage: true,
      preview: 'docker run "${runtime[@]}" --mount "type=bind,source=$app_path,target=/workspace,readonly" "$image" install /workspace',
      apply: 'docker run "${runtime[@]}" --mount "type=bind,source=$app_path,target=/workspace" "$image" doctor /workspace --fix',
    });
    expect(doctorFix('aikit', 'posix', '.', '1.4.5').legacyImage).toBe(false);
  });

  it('reviews MCP servers through a read-only project mount', () => {
    expect(mcpReport('aikit', 'posix', '.')).toBe('aikit mcp report .');
    expect(mcpReport('module', 'powershell', 'C:\\My App')).toBe("python -m aikit.aikit_cli mcp report 'C:\\My App'");
    expect(mcpReport('source', 'posix', '/srv/app')).toBe('python3 aikit_cli.py mcp report /srv/app');
    expect(mcpReport('docker', 'powershell', '.')).toBe(
      'docker run @runtime --mount "type=bind,source=$appPath,target=/workspace,readonly" $image mcp report /workspace');
  });

  it('prints the flag schema or writes it with --output', () => {
    expect(flagsCommand('aikit', 'posix')).toBe('aikit flags');
    expect(flagsCommand('venv', 'powershell', ' docs\\installer flags.json ')).toBe(`& "$cliEnv\\Scripts\\aikit.exe" flags --output 'docs\\installer flags.json'`);
    expect(flagsCommand('source', 'posix', 'installer-flags.json')).toBe('python3 aikit_cli.py flags --output installer-flags.json');
    // Docker has no project mount for printing and writes into the mounted folder otherwise.
    expect(flagsCommand('docker', 'posix')).toBe('docker run "${runtime[@]}" "$image" flags');
    expect(flagsCommand('docker', 'powershell', '.\\docs\\flags.json')).toBe(
      'docker run @runtime --mount "type=bind,source=$appPath,target=/workspace" $image flags --output /workspace/docs/flags.json');
  });

  it('checks the --output path', () => {
    expect(flagsOutputProblem('aikit', 'posix', 'installer-flags.json')).toBeNull();
    expect(flagsOutputProblem('aikit', 'posix', '/tmp/flags.json')).toBeNull();
    expect(flagsOutputProblem('aikit', 'posix', '  ')).toBe('empty');
    for (const path of ['-x', 'docs/', '.', '..', 'a\u0007b']) expect(flagsOutputProblem('aikit', 'posix', path)).toBe('invalid');
    for (const path of ['/tmp/flags.json', 'C:\\flags.json', '../flags.json']) expect(flagsOutputProblem('docker', 'posix', path)).toBe('docker-path');
    expect(flagsOutputProblem('aikit', 'powershell', 'a"b.json')).toBe('powershell-quote');
  });

  it('prepares session variables only where needed', () => {
    expect(sessionSetup('aikit', 'posix', '.')).toBeNull();
    expect(sessionSetup('docker', 'powershell', "C:\\It's here")).toContain("Resolve-Path -LiteralPath 'C:\\It''s here'");
    expect(sessionSetup('docker', 'posix', '.')).toContain('--user "$(id -u):$(id -g)"');
    expect(upgradeCommand('aikit', 'posix')).toBe('pipx upgrade ai-kit-python');
  });
});

describe('quote', () => {
  it('leaves safe words bare', () => {
    expect(quote('.', 'posix')).toBe('.');
    expect(quote('C:\\Projects\\app', 'powershell')).toBe('C:\\Projects\\app');
    expect(quote('ai-kit/CORE.md', 'posix')).toBe('ai-kit/CORE.md');
  });

  it('quotes characters with shell meaning', () => {
    for (const value of ['a b', '$HOME', 'a;b', 'a&b', 'a|b', '(x)', 'a`b', '*', 'Русский']) {
      expect(quote(value, 'posix')).toMatch(/^'.*'$/);
      expect(quote(value, 'powershell')).toMatch(/^'.*'$/);
    }
    expect(quote('a,b', 'powershell')).toBe("'a,b'");
    expect(quote('@x', 'powershell')).toBe("'@x'");
  });
});
