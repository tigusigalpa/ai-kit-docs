import { AGENTS, EXTRAS, PRESETS, type Agent, type Extra, type Preset } from '../data/catalog';
import { freshDefaults, RUNNERS, sortAgents, sortExtras, updateDefaults, type Config, type Runner } from './config';
import type { Shell } from './shell';

export interface Shared { config: Config; runner: Runner; shell: Shell }

/** Encode a configuration into query parameters; only values differing from scenario defaults are kept. */
export function encode({ config, runner, shell }: Shared): string {
  const params = new URLSearchParams();
  const base = config.scenario === 'update' ? updateDefaults() : freshDefaults();
  params.set('run', runner);
  params.set('sh', shell);
  if (config.scenario === 'update') params.set('scenario', 'update');
  if (config.target !== base.target) params.set('target', config.target);
  if (config.preset !== base.preset) params.set('preset', config.preset || 'none');
  if (config.mode) params.set('mode', config.mode);
  if (config.agents.join() !== base.agents.join()) params.set('agents', config.agents.join(',') || 'none');
  if (config.chatLanguage) params.set('lang', config.chatLanguage);
  if (config.conventions) params.set('conv', config.conventions);
  if (config.extras.length) params.set('with', config.extras.join(','));
  if (config.interactive) params.set('interactive', '1');
  if (!config.check) params.set('check', '0');
  config.acceptLocal.forEach(path => params.append('accept', path));
  return params.toString();
}

const list = <T extends string>(value: string | null, allowed: readonly T[]) =>
  (value ?? '').split(',').filter((item): item is T => (allowed as readonly string[]).includes(item));

/** Decode untrusted query parameters, keeping only recognised values. */
export function decode(query: string): Shared | null {
  const params = new URLSearchParams(query);
  if (!params.has('run') && !params.has('scenario')) return null;
  const config = params.get('scenario') === 'update' ? updateDefaults() : freshDefaults();
  const runner = (RUNNERS as readonly string[]).includes(params.get('run') ?? '') ? params.get('run') as Runner : 'aikit';
  const shell: Shell = params.get('sh') === 'posix' ? 'posix' : 'powershell';
  const text = (key: string, max: number) => (params.get(key) ?? '').slice(0, max);
  if (params.has('target')) config.target = text('target', 400);
  const preset = params.get('preset');
  if (preset === 'none') config.preset = '';
  else if ((PRESETS as readonly string[]).includes(preset ?? '')) config.preset = preset as Preset;
  const mode = params.get('mode');
  if (mode === 'private' || mode === 'team') config.mode = mode;
  if (params.has('agents')) config.agents = sortAgents(list<Agent>(params.get('agents'), AGENTS));
  if (params.has('lang')) config.chatLanguage = text('lang', 80);
  const conventions = params.get('conv');
  if (conventions === 'owner' || conventions === 'standard') config.conventions = conventions;
  config.extras = sortExtras(list<Extra>(params.get('with'), EXTRAS));
  config.interactive = params.get('interactive') === '1';
  config.check = params.get('check') !== '0';
  config.acceptLocal = params.getAll('accept').slice(0, 20).map(path => path.slice(0, 300));
  return { config, runner, shell };
}
