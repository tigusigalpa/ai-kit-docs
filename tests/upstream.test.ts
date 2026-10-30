// Runs generated installer options through the pinned AI-KIT checkout in tmp/upstream-ai-kit.
// Previews write nothing; apply runs only inside fresh temporary folders.
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve as resolvePath } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { AGENTS, EXTRAS, PRESETS, type Agent, type Extra } from '../src/data/catalog';
import { UPSTREAM } from '../src/data/upstream';
import { installOptions } from '../src/domain/command';
import { freshDefaults, resolve, settingsPreview, type Config } from '../src/domain/config';
import { footprint } from '../src/domain/footprint';

const upstream = resolvePath(process.env.AIKIT_UPSTREAM ?? 'tmp/upstream-ai-kit');
const installer = join(upstream, 'scripts', 'install.py');
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
    };
  }
}

const scenarios: [string, Config][] = [
  ['defaults', freshDefaults()],
  ['bare', { ...freshDefaults(), preset: '', agents: [] }],
  ['team bundle', { ...freshDefaults(), preset: 'team', extras: ['data-guards', 'web-design', 'context7'], chatLanguage: 'English', conventions: 'standard' }],
  ['strict override', { ...freshDefaults(), preset: 'strict', mode: 'team', agents: ['claude'], extras: ['orchestration', 'strix', 'security-audit'] }],
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
});
