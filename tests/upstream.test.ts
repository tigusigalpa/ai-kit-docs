// Runs generated installer options through the pinned AI-KIT checkout in tmp/upstream-ai-kit.
// Previews write nothing; apply runs only inside fresh temporary folders.
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve as resolvePath } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { MAIN_FLAGS, MODULE_FLAGS } from '../src/components/Reference';
import { AGENTS, DOCKER_CLEANUP, EXTRAS, PRESETS, type Agent, type Extra } from '../src/data/catalog';
import { UPSTREAM } from '../src/data/upstream';
import { installOptions } from '../src/domain/command';
import { freshDefaults, resolve, settingsPreview, type Config } from '../src/domain/config';
import { footprint } from '../src/domain/footprint';

const upstream = resolvePath(process.env.AIKIT_UPSTREAM ?? 'tmp/upstream-ai-kit');
const installer = join(upstream, 'scripts', 'install.py');
const doctor = join(upstream, 'scripts', 'doctor.py');
const available = existsSync(installer);
const python = process.env.PYTHON ?? (process.platform === 'win32' ? 'python' : 'python3');
const work = available ? mkdtempSync(join(tmpdir(), 'ai-kit-docs-')) : '';
let counter = 0;

afterAll(() => { if (work) rmSync(work, { recursive: true, force: true }); });

function run(config: Config, apply: boolean) {
  const target = join(work, `app-${counter++}`);
  const result = spawnSync(python, ['-I', installer, target, ...installOptions(config), ...(apply ? ['--apply'] : [])], { encoding: 'utf8' });
  return { target, status: result.status, stderr: result.stderr, plan: result.stdout ? JSON.parse(result.stdout) : null };
}

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

  it.each(scenarios.slice(0, 8))('apply writes the predicted settings.json: %s', (_name, config) => {
    const { status, target } = run(config, true);
    expect(status).toBe(0);
    const written = readFileSync(join(target, 'ai-kit', 'settings.json'), 'utf8');
    expect(JSON.stringify(JSON.parse(written))).toBe(JSON.stringify(settingsPreview(config)));
  });

  it('accepts exactly the options in the flag reference', () => {
    const help = execFileSync(python, ['-I', installer, '--help'], { encoding: 'utf8', env: { ...process.env, NO_COLOR: '1', COLUMNS: '200' } })
      .replaceAll('\r\n', '\n');
    const usage = help.slice(0, help.indexOf('\n\n'));
    const accepted = [...usage.matchAll(/(?<=[\s[|])(-[a-z]|--[a-z0-9-]+)(?=[\s\]|])/g)].map(match => match[1]).sort();
    const documented = [...MAIN_FLAGS, ...MODULE_FLAGS].map(row => row.flag).filter(flag => flag !== 'TARGET')
      .map(flag => flag === '-h, --help' ? '-h' : flag).sort();
    expect(documented).toEqual(accepted);
    expect(MAIN_FLAGS.length + MODULE_FLAGS.length).toBe(24);
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
});
