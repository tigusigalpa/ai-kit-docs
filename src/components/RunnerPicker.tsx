import type { Runner } from '../domain/config';
import type { Shell } from '../domain/shell';
import type { Language, T } from '../i18n';
import { Icon, type IconName } from './Icon';

export const RUNNER_INFO: Record<Runner, { icon: IconName; title: [string, string]; hint: [string, string] }> = {
  aikit: { icon: 'terminal', title: ['aikit command', 'Команда aikit'], hint: ['pip or pipx install', 'Установка через pip или pipx'] },
  module: { icon: 'python', title: ['python -m', 'python -m'], hint: ['Works without PATH', 'Работает без PATH'] },
  venv: { icon: 'box', title: ['Isolated venv', 'Изолированный venv'], hint: ['Explicit executable', 'Явный путь к exe'] },
  docker: { icon: 'layers', title: ['Docker image', 'Docker-образ'], hint: ['No host Python', 'Без Python на хосте'] },
  source: { icon: 'github', title: ['Source checkout', 'Из исходников'], hint: ['git clone + scripts/', 'git clone + scripts/'] },
};

export function RunnerPicker({ runner, shell, onRunner, onShell, t, language, compact }: {
  runner: Runner; shell: Shell; onRunner: (runner: Runner) => void; onShell: (shell: Shell) => void; t: T; language: Language; compact?: boolean;
}) {
  const index = language === 'ru' ? 1 : 0;
  return <div className={compact ? 'runner-picker compact' : 'runner-picker'}>
    <div className="runner-options" role="radiogroup" aria-label={t('How you run AI-KIT', 'Как вы запускаете AI-KIT')}>
      {(Object.keys(RUNNER_INFO) as Runner[]).map(value => {
        const info = RUNNER_INFO[value];
        return <label key={value} className="runner-option" data-checked={value === runner}>
          <input type="radio" name={compact ? 'runner-compact' : 'runner'} value={value} checked={value === runner} onChange={() => onRunner(value)}/>
          <Icon name={info.icon} size={18}/>
          <span><strong>{info.title[index]}</strong><small>{info.hint[index]}</small></span>
        </label>;
      })}
    </div>
    <div className="shell-switch" role="radiogroup" aria-label={t('Shell', 'Оболочка')}>
      {([['powershell', 'Windows · PowerShell'], ['posix', t('Linux / macOS · Bash', 'Linux / macOS · Bash')]] as const).map(([value, label]) =>
        <label key={value} data-checked={value === shell}>
          <input type="radio" name={compact ? 'shell-compact' : 'shell'} value={value} checked={value === shell} onChange={() => onShell(value)}/>
          <span>{label}</span>
        </label>)}
    </div>
  </div>;
}
