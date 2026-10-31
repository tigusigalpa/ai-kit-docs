// Runs generated installer options through the pinned AI-KIT checkout in tmp/upstream-ai-kit (or AIKIT_UPSTREAM).
// Previews write nothing; apply runs only inside fresh temporary folders.
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve as resolvePath } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { MAIN_FLAGS, MODULE_FLAGS } from '../src/components/Reference';
import { AGENTS, DOCKER_CLEANUP, EXTRAS, PRESET_INFO, PRESETS, settingsKey, type Agent, type Extra } from '../src/data/catalog';
import { UPSTREAM } from '../src/data/upstream';
import { flagsCommand, installOptions, mcpReport } from '../src/domain/command';
import { freshDefaults, resolve, settingsPreview, updateDefaults, type Config } from '../src/domain/config';
import { footprint } from '../src/domain/footprint';

const upstream = resolvePath(process.env.AIKIT_UPSTREAM ?? 'tmp/upstream-ai-kit');
const installer = join(upstream, 'scripts', 'install.py');
const doctor = join(upstream, 'scripts', 'doctor.py');
const cli = join(upstream, 'aikit_cli.py');
const available = existsSync(installer);
const python = process.env.PYTHON ?? (process.platform === 'win32' ? 'python' : 'python3');
const work = available ? mkdtempSync(join(tmpdir(), 'ai-kit-docs-')) : '';
let counter = 0;

afterAll(() => { if (work) rmSync(work, { recursive: true, force: true }); });

function runIn(target: string, config: Config, apply: boolean) {
  const result = spawnSync(python, ['-I', installer, target, ...installOptions(config), ...(apply ? ['--apply'] : [])], { encoding: 'utf8' });
  return { target, status: result.status, stderr: result.stderr, plan: result.stdout ? JSON.parse(result.stdout) : null };
}
const run = (config: Config, apply: boolean) => runIn(join(work, `app-${counter++}`), config, apply);

// The dispatcher prefers an installed ai-kit-python package; -S keeps it to the checkout's own modules.
const aikit = (...args: string[]) => spawnSync(python, ['-I', '-S', cli, ...args], { encoding: 'utf8' });
/** Words of a generated `aikit ...` command between the program name and its last `drop` arguments. */
const words = (command: string, drop: number) => command.split(' ').slice(1, drop ? -drop : undefined);

interface SchemaOption { option: string; value: string; choices?: string[]; repeatable?: boolean; excludes?: string[]; setting?: string; fresh_default?: unknown; required?: boolean; help?: string }
const schemaPath = join(upstream, 'integrations', 'installer-flags.json');
const schema = available ? JSON.parse(readFileSync(schemaPath, 'utf8')) as { schema: number; command: string; options: SchemaOption[]; presets: Record<string, { mode: string | null; extras: string[] }> } : null;

// Deterministic pseudo-random selections cover combinations beyond the hand-written scenarios.
function* sample(count: number): Generator<Config> {
  let seed = 7;
  const next = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let index = 0; index < count; index++) {
    yield {
      ...freshDefaults(),
      preset: next() < 0.25 ? '' : PRESETS[Math.floor(next() * PRESETS.length)],
      mode: next() < 0.6 ? '' : next() < 0.5 ? 'private' : 'team',
      agents: AGENTS.filter(() => next() < 0.3) as Agent[],
      extras: EXTRAS.filter(() => next() < 0.3) as Extra[],
      conventions: next() < 0.5 ? '' : 'standard',
      dockerCleanup: next() < 0.5 ? '' : DOCKER_CLEANUP[Math.floor(next() * DOCKER_CLEANUP.length)],
    };
  }
}

const scenarios: [string, Config][] = [
  ['defaults', freshDefaults()],
  ['bare', { ...freshDefaults(), preset: '', agents: [] }],
  ['team bundle', { ...freshDefaults(), preset: 'team', extras: ['data-guards', 'web-design', 'context7'], chatLanguage: 'English', conventions: 'standard', dockerCleanup: 'keep-cache' }],
  ['strict override', { ...freshDefaults(), preset: 'strict', mode: 'team', agents: ['claude'], extras: ['orchestration', 'strix', 'security-audit'], dockerCleanup: 'maximum' }],
  ['minimal plus explicit', { ...freshDefaults(), preset: 'minimal', agents: [...AGENTS], extras: ['native-settings', 'ci'] }],
  ['team with private', { ...freshDefaults(), preset: 'team', mode: 'private', agents: ['codex', 'cursor', 'gemini', 'aider'] }],
  ['unicode language', { ...freshDefaults(), chatLanguage: 'Português do Brasil' }],
  ['1.6.0 options', { ...freshDefaults(), preset: 'strict', agents: ['codex', 'claude', 'devin'], extras: ['uuid', 'claude-github', 'web-design'], chatLanguage: 'Russian' }],
  ['devin and legacy windsurf', { ...freshDefaults(), preset: 'team', agents: ['devin', 'windsurf', 'cursor'], extras: ['uuid'] }],
  ['claude-github without claude', { ...freshDefaults(), preset: '', agents: ['codex'], extras: ['claude-github'] }],
  ...[...sample(14)].map((config, index): [string, Config] => [`sample ${index + 1}`, config]),
];

describe.skipIf(!available)(`AI-KIT ${UPSTREAM.version} installer`, () => {
  it('is the pinned release', () => {
    expect(readFileSync(join(upstream, 'VERSION'), 'utf8').trim()).toBe(UPSTREAM.version);
    expect(execFileSync('git', ['-C', upstream, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()).toBe(UPSTREAM.commit);
  });

  it.each(scenarios)('preview matches the model: %s', (_name, config) => {
    const { status, stderr, plan } = run(config, false);
    expect(stderr).toBe('');
    expect(status).toBe(0);
    const resolved = resolve(config);
    expect(plan.preview).toBe(true);
    expect(plan.mode).toBe(resolved.mode);
    expect(plan.preset).toBe(config.preset || null);
    expect([...plan.extras].sort()).toEqual([...resolved.extras].sort());
    expect(plan.writes).toEqual(footprint(resolved.agents ?? ['codex'], resolved.extras, resolved.mode ?? 'private'));
  });

  it.each(scenarios.slice(0, 10))('apply writes the predicted settings.json: %s', (_name, config) => {
    const { status, target } = run(config, true);
    expect(status).toBe(0);
    const written = readFileSync(join(target, 'ai-kit', 'settings.json'), 'utf8');
    expect(JSON.stringify(JSON.parse(written))).toBe(JSON.stringify(settingsPreview(config)));
  });

  it('reports the 1.6.0 client warnings the configurator mirrors', () => {
    const lonely = run({ ...freshDefaults(), preset: '', agents: ['codex'], extras: ['claude-github'] }, false);
    expect(lonely.plan.warnings.join('\n')).toContain('claude-github guidance requires --agent claude');
    const legacy = run({ ...freshDefaults(), preset: '', agents: ['windsurf'] }, true);
    expect(legacy.status).toBe(0);
    const moving = runIn(legacy.target, { ...updateDefaults(), agents: ['devin', 'windsurf'] }, false);
    expect(moving.plan.warnings.join('\n')).toContain('Devin (Windsurf) also loads legacy .windsurf rules');
  });

  it('accepts exactly the options in the flag reference', () => {
    const help = execFileSync(python, ['-I', installer, '--help'], { encoding: 'utf8', env: { ...process.env, NO_COLOR: '1', COLUMNS: '200' } })
      .replaceAll('\r\n', '\n');
    const usage = help.slice(0, help.indexOf('\n\n'));
    const accepted = [...usage.matchAll(/(?<=[\s[|])(-[a-z]|--[a-z0-9-]+)(?=[\s\]|])/g)].map(match => match[1]).sort();
    const documented = [...MAIN_FLAGS, ...MODULE_FLAGS].map(row => row.flag).filter(flag => flag !== 'TARGET')
      .map(flag => flag === '-h, --help' ? '-h' : flag).sort();
    expect(documented).toEqual(accepted);
    expect(MAIN_FLAGS.length + MODULE_FLAGS.length).toBe(27);
    const choices = Object.fromEntries([...usage.matchAll(/(--[a-z-]+) \{([^}]+)\}/g)].map(match => [match[1], match[2].split(',')]));
    expect(choices['--docker-cleanup']).toEqual([...DOCKER_CLEANUP]);
    expect(choices['--preset']).toEqual([...PRESETS]);
    expect(choices['--agent']).toEqual([...AGENTS].sort());
  });

  it('doctor --fix previews the repair, --fix --apply writes it and --apply alone is refused', () => {
    const { status, target } = run(freshDefaults(), true);
    expect(status).toBe(0);
    const core = join(target, 'ai-kit', 'CORE.md');
    rmSync(core);
    const doctorRun = (...args: string[]) => spawnSync(python, ['-I', doctor, target, ...args], { encoding: 'utf8' });
    const preview = doctorRun('--fix');
    expect(JSON.parse(preview.stdout).fix).toMatchObject({ preview: true, applied: false });
    expect(JSON.parse(preview.stdout).fix.writes).toContain('ai-kit/CORE.md');
    expect(existsSync(core)).toBe(false);
    const refused = doctorRun('--apply');
    expect(refused.status).toBe(2);
    expect(refused.stderr).toContain('--apply requires --fix');
    expect(existsSync(core)).toBe(false);
    const applied = doctorRun('--fix', '--apply');
    expect(JSON.parse(applied.stdout).fix).toMatchObject({ preview: false });
    expect(existsSync(core)).toBe(true);
  });

  it('matches the flag reference and configurator to the installer-flags.json schema', () => {
    if (!schema) throw new Error('schema missing');
    expect(schema.schema).toBe(1);
    expect(schema.command).toBe('aikit install');
    const options = Object.fromEntries(schema.options.map(option => [option.option, option]));
    const rows = [...MAIN_FLAGS, ...MODULE_FLAGS].filter(row => row.flag !== '-h, --help');
    expect(rows.map(row => row.flag).sort()).toEqual(Object.keys(options).sort());
    for (const row of rows) {
      const option = options[row.flag];
      expect(option.help, row.flag).toBeTruthy();
      expect(row.value[0] === 'Switch', row.flag).toBe(option.value === 'switch');
    }
    expect(options.TARGET).toMatchObject({ value: 'path', required: true });
    expect(options['--apply'].excludes).toEqual(['--dry-run']);
    expect(schema.options.filter(option => option.repeatable).map(option => option.option).sort()).toEqual(['--accept-local', '--agent']);
    expect(options['--mode'].choices).toEqual(['private', 'team']);
    expect(options['--conventions'].choices).toEqual(['owner', 'standard']);
    expect(options['--docker-cleanup'].choices).toEqual([...DOCKER_CLEANUP]);
    expect(options['--preset'].choices).toEqual([...PRESETS]);
    expect(options['--agent'].choices).toEqual([...AGENTS].sort());
    // Every saved setting is a settings.json key, and the fresh defaults match the site's model.
    for (const extra of EXTRAS) expect(options[`--with-${extra}`].setting).toBe(settingsKey(extra));
    const bare = { ...freshDefaults(), preset: '' as const, agents: [] };
    const everything = settingsPreview({ ...bare, extras: [...EXTRAS] });
    for (const option of schema.options.filter(item => item.setting)) expect(Object.keys(everything), option.option).toContain(option.setting);
    const defaults = settingsPreview(bare);
    for (const option of schema.options.filter(item => 'fresh_default' in item)) {
      const modelled = option.option === '--agent' ? resolve(bare).agents : defaults[option.setting ?? ''];
      expect(modelled, option.option).toEqual(option.fresh_default);
    }
    expect(Object.keys(schema.presets)).toEqual([...PRESETS]);
    for (const preset of PRESETS) {
      expect(schema.presets[preset].mode).toBe(PRESET_INFO[preset].mode);
      expect([...schema.presets[preset].extras].sort()).toEqual([...PRESET_INFO[preset].extras].sort());
    }
    expect(options['--allow-downgrade']).toMatchObject({ value: 'switch' });
    expect(options['--allow-downgrade'].setting).toBeUndefined();
  });

  it('aikit flags prints that schema and --output writes it with LF line endings', () => {
    const committed = readFileSync(schemaPath, 'utf8').replaceAll('\r\n', '\n');
    const printed = aikit(...words(flagsCommand('aikit', 'posix'), 0));
    expect(printed.stderr).toBe('');
    expect(printed.status).toBe(0);
    expect(JSON.parse(printed.stdout)).toEqual(JSON.parse(committed));
    const file = join(work, 'flags-output', 'installer-flags.json');
    const written = aikit(...words(flagsCommand('aikit', 'posix', 'installer-flags.json'), 1), file);
    expect(written.status).toBe(0);
    expect(readFileSync(file, 'utf8')).toBe(committed);
  });

  it('aikit mcp report lists project MCP servers without printing secret values', () => {
    const project = join(work, 'mcp-project');
    mkdirSync(project);
    const secret = 'sk-test-0123456789abcdefghijklmnop';
    writeFileSync(join(project, '.mcp.json'), JSON.stringify({ mcpServers: {
      docs: { command: 'npx', args: ['-y', 'docs-server'], env: { API_KEY: secret, HOME_DIR: '${HOME}' } },
      remote: { url: `http://user:${secret}@example.com/mcp?token=${secret}` },
    } }));
    const result = aikit(...words(mcpReport('aikit', 'posix', '.'), 1), project);
    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
    expect(result.stdout).not.toContain(secret);
    const report = JSON.parse(result.stdout);
    expect(report.files).toMatchObject([{ client: 'claude', file: '.mcp.json', servers: 2 }]);
    expect(report.servers.map((server: { name: string }) => server.name)).toEqual(['docs', 'remote']);
    expect(report.servers[0]).toMatchObject({ transport: 'stdio', command: 'npx', env: { API_KEY: '<literal hidden>', HOME_DIR: '${HOME}' } });
    expect(report.servers[1]).toMatchObject({ transport: 'http', url: 'http://example.com/mcp?<hidden>' });
    const warnings = report.warnings.join('\n');
    for (const text of ['API_KEY holds a literal value', 'credentials in URL', 'plain HTTP to a remote host']) expect(warnings).toContain(text);
  });

  it('refuses to downgrade a newer installation unless --allow-downgrade is passed', () => {
    const { status, target } = run(freshDefaults(), true);
    expect(status).toBe(0);
    const statePath = join(target, 'ai-kit', '.install-state.json');
    const record = (version: string) => writeFileSync(statePath, JSON.stringify({ ...JSON.parse(readFileSync(statePath, 'utf8')), accepted_version: version }, null, 2));
    const doctorRun = (...args: string[]) => spawnSync(python, ['-I', doctor, target, ...args], { encoding: 'utf8' });
    // An older installation: doctor names the upgrade commands.
    record('1.0.0');
    expect(JSON.parse(doctorRun().stdout).info.join('\n')).toContain(`AI-KIT ${UPSTREAM.version} is available`);
    // A newer installation: preview warns, apply and doctor --fix --apply refuse, --allow-downgrade applies.
    record('99.0.0');
    expect(JSON.parse(doctorRun().stdout).warnings.join('\n')).toContain('newer than this CLI');
    const preview = runIn(target, updateDefaults(), false);
    expect(preview.status).toBe(0);
    expect(preview.plan.warnings.join('\n')).toContain('pass --allow-downgrade');
    const refused = runIn(target, updateDefaults(), true);
    expect(refused.status).toBe(1);
    expect(refused.stderr).toContain('Refusing to downgrade AI-KIT 99.0.0');
    const fixRefused = doctorRun('--fix', '--apply');
    expect(fixRefused.status).toBe(1);
    expect(fixRefused.stderr).toContain('Refusing to downgrade');
    const allowed = runIn(target, { ...updateDefaults(), allowDowngrade: true }, true);
    expect(allowed.stderr).toBe('');
    expect(allowed.status).toBe(0);
    expect(JSON.parse(readFileSync(statePath, 'utf8')).accepted_version).toBe(UPSTREAM.version);
  });
});
