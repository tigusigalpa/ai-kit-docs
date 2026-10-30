import { describe, expect, it } from 'vitest';
import { installCommand, installOptions, invocation, sessionSetup, upgradeCommand } from '../src/domain/command';
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
