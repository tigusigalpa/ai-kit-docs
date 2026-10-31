import { describe, expect, it } from 'vitest';
import { freshDefaults, resolve, settingsPreview, updateDefaults, validate, type Config } from '../src/domain/config';
import { buildTree, footprint } from '../src/domain/footprint';
import { decode, encode } from '../src/domain/share';

const config = (patch: Partial<Config> = {}): Config => ({ ...freshDefaults(), ...patch });
const codes = (value: Config, runner: Parameters<typeof validate>[1] = 'aikit', shell: Parameters<typeof validate>[2] = 'posix') =>
  validate(value, runner, shell).map(issue => issue.code);

describe('resolution', () => {
  it('applies preset mode unless an explicit mode wins', () => {
    expect(resolve(config({ preset: 'team' })).mode).toBe('team');
    expect(resolve(config({ preset: 'team', mode: 'private' })).mode).toBe('private');
    expect(resolve(config({ preset: 'strict' })).mode).toBe('private');
    expect(resolve({ ...updateDefaults(), preset: 'strict' }).mode).toBeNull();
  });

  it('reports preset-managed extras the preset turns off', () => {
    expect(resolve(config({ preset: 'solo', extras: ['guards'] })).presetDisabled).toEqual(['data-guards']);
    expect(resolve(config({ preset: '' })).presetDisabled).toEqual([]);
  });

  it('writes settings.json keys like install.py', () => {
    expect(Object.keys(settingsPreview(config({ preset: '', extras: ['ci', 'guards'] })))).toEqual(
      ['project_language', 'chat_language', 'sharing_mode', 'conventions', 'docker_cleanup', 'upstream', 'guards', 'ci']);
    expect(settingsPreview(config())).toMatchObject({ sharing_mode: 'private', docker_cleanup: 'maximum', session_start: true, guards: false, data_guards: false, native_settings: true, scoped_rules: true });
    expect(settingsPreview(config({ dockerCleanup: 'keep-cache' })).docker_cleanup).toBe('keep-cache');
  });

  it('defaults Docker cleanup to maximum only for a fresh installation', () => {
    expect(resolve(config()).dockerCleanup).toBe('maximum');
    expect(resolve(updateDefaults()).dockerCleanup).toBeNull();
    expect(resolve({ ...updateDefaults(), dockerCleanup: 'keep-cache' }).dockerCleanup).toBe('keep-cache');
  });
});

describe('validation', () => {
  it('requires an absolute target for a source checkout', () => {
    expect(codes(config(), 'source')).toContain('source-target');
    expect(codes(config({ target: '/srv/app' }), 'source')).not.toContain('source-target');
    expect(codes(config({ target: 'D:\\work\\app' }), 'source', 'powershell')).not.toContain('source-target');
  });

  it('checks chat language like the installer', () => {
    expect(codes(config({ chatLanguage: 'x'.repeat(61) }))).toContain('chat-language');
    expect(codes(config({ chatLanguage: 'bad\u0007' }))).toContain('chat-language');
    expect(codes(config({ chatLanguage: 'Português do Brasil' }))).not.toContain('chat-language');
  });

  it('rejects unsafe accept-local paths', () => {
    for (const path of ['../AGENTS.md', '/etc/passwd', '-x', 'C:\\x']) expect(codes(config({ acceptLocal: [path] }))).toContain('accept-local');
    expect(codes(config({ acceptLocal: ['ai-kit/settings.json'] }))).toContain('accept-settings');
    expect(codes(config({ acceptLocal: ['AGENTS.md'] }))).not.toContain('accept-local');
  });

  it('warns when extras need a client that is not selected', () => {
    expect(codes(config({ agents: ['codex'], extras: ['guards'] }))).toContain('needs-claude');
    expect(codes(config({ agents: ['claude'], extras: ['orchestration'] }))).toContain('needs-codex');
    expect(codes(config())).not.toContain('needs-claude');
  });

  it('accepts every option with the published Docker image', () => {
    const update = { ...updateDefaults(), dockerCleanup: 'keep-cache' as const, allowDowngrade: true };
    expect(codes(update, 'docker')).not.toContain('docker-option-image');
    expect(codes(config(), 'docker')).not.toContain('docker-image');
  });

  it('blocks options a lagging Docker image would reject', () => {
    const lagging = (value: Config, runner: Parameters<typeof validate>[1] = 'docker') => validate(value, runner, 'posix', '1.4.5');
    const update = { ...updateDefaults(), dockerCleanup: 'keep-cache' as const, allowDowngrade: true };
    expect(lagging(update).filter(issue => issue.code === 'docker-option-image').map(issue => [issue.detail, issue.field]))
      .toEqual([['--docker-cleanup', 'dockerCleanup'], ['--allow-downgrade', 'allowDowngrade']]);
    expect(lagging(config()).map(issue => issue.code)).toContain('docker-image');
    expect(lagging(config()).map(issue => issue.code)).not.toContain('docker-option-image');
    expect(validate(update, 'docker', 'posix', '1.4.6').filter(issue => issue.code === 'docker-option-image').map(issue => issue.detail)).toEqual(['--allow-downgrade']);
    expect(lagging(update, 'aikit').map(issue => issue.code)).not.toContain('docker-option-image');
  });

  it('warns about a deliberate downgrade only when updating', () => {
    expect(codes({ ...updateDefaults(), allowDowngrade: true })).toContain('allow-downgrade');
    expect(codes(config({ allowDowngrade: true }))).not.toContain('allow-downgrade');
    expect(codes(updateDefaults())).not.toContain('allow-downgrade');
  });

  it('explains that the CI check needs team mode', () => {
    expect(codes(config({ extras: ['ci'] }))).toContain('ci-private');
    expect(codes(config({ preset: 'team', extras: ['ci'] }))).not.toContain('ci-private');
  });

  it('blocks double quotes for PowerShell only', () => {
    expect(codes(config({ chatLanguage: 'a"b' }), 'aikit', 'powershell')).toContain('powershell-quote');
    expect(codes(config({ chatLanguage: 'a"b' }), 'aikit', 'posix')).not.toContain('powershell-quote');
  });
});

describe('share links', () => {
  it('round-trips a configuration', () => {
    const value = config({ target: 'C:\\Apps\\x y', preset: '', mode: 'team', agents: ['claude', 'cursor'], chatLanguage: 'English', conventions: 'standard', dockerCleanup: 'keep-cache', extras: ['ci', 'strix'], interactive: true, check: false, acceptLocal: ['AGENTS.md'] });
    expect(decode(encode({ config: value, runner: 'docker', shell: 'powershell' }))).toEqual({ config: value, runner: 'docker', shell: 'powershell' });
    const update = { ...updateDefaults(), extras: ['context7' as const] };
    expect(decode(encode({ config: update, runner: 'aikit', shell: 'posix' }))?.config).toEqual(update);
    const downgrade = { ...updateDefaults(), allowDowngrade: true };
    expect(encode({ config: downgrade, runner: 'aikit', shell: 'posix' })).toContain('downgrade=1');
    expect(decode(encode({ config: downgrade, runner: 'aikit', shell: 'posix' }))?.config).toEqual(downgrade);
  });

  it('keeps --allow-downgrade out of new-installation links', () => {
    expect(encode({ config: config({ allowDowngrade: true }), runner: 'aikit', shell: 'posix' })).not.toContain('downgrade');
    expect(decode('run=aikit&downgrade=1')?.config.allowDowngrade).toBe(false);
    expect(decode('scenario=update&downgrade=yes')?.config.allowDowngrade).toBe(false);
  });

  it('ignores unknown values', () => {
    const shared = decode('run=evil&preset=root&agents=codex,hacker&with=ci,rm&cleanup=none');
    expect(shared?.runner).toBe('aikit');
    expect(shared?.config.dockerCleanup).toBe('');
    expect(shared?.config.preset).toBe('solo');
    expect(shared?.config.agents).toEqual(['codex']);
    expect(shared?.config.extras).toEqual(['ci']);
    expect(decode('')).toBeNull();
  });
});

describe('footprint', () => {
  it('adds client and extra files', () => {
    const base = footprint(['codex'], [], 'private');
    expect(base).toContain('AGENTS.md');
    expect(base).not.toContain('CLAUDE.md');
    expect(footprint(['claude'], ['guards'], 'private')).toContain('.claude/settings.local.json');
    expect(footprint(['claude'], ['guards'], 'team')).toContain('.claude/settings.json');
    expect(footprint(['codex'], ['guards'], 'private')).toEqual(base);
  });

  it('builds a folder tree with counts', () => {
    const tree = buildTree(['a/b.md', 'a/c/d.md', 'e.md']);
    expect(tree.files).toBe(3);
    expect(tree.children.map(node => node.name)).toEqual(['a', 'e.md']);
    expect(tree.children[0].files).toBe(2);
  });
});
