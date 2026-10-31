import { useId, type ReactNode } from 'react';
import { AGENT_INFO, AGENTS, CURRENT_AGENTS, DOCKER_CLEANUP_INFO, EXTRA_INFO, LANGUAGE_SUGGESTIONS, MODULE_EXTRAS, PRESET_EXTRAS, PRESET_INFO, PRESETS, type Agent, type Extra, type Preset } from '../data/catalog';
import { guideLink, sourceLink } from '../data/upstream';
import { freshDefaults, resolve, sortAgents, sortExtras, updateDefaults, validate, type Config, type Runner } from '../domain/config';
import type { Shell } from '../domain/shell';
import { pick, type Language, type T } from '../i18n';
import { Segmented } from './CodeBlock';
import { Icon } from './Icon';
import { ResultPanel } from './ResultPanel';
import { RunnerPicker } from './RunnerPicker';

interface Props {
  config: Config; onChange: (config: Config) => void; runner: Runner; shell: Shell;
  onRunner: (runner: Runner) => void; onShell: (shell: Shell) => void; t: T; language: Language;
}

function Group({ index, title, hint, children }: { index: string; title: string; hint?: ReactNode; children: ReactNode }) {
  return <fieldset className="config-group">
    <legend><span className="group-index">{index}</span>{title}</legend>
    {hint && <p className="group-hint">{hint}</p>}
    {children}
  </fieldset>;
}

export function Configurator({ config, onChange, runner, shell, onRunner, onShell, t, language }: Props) {
  const ids = useId();
  const resolved = resolve(config);
  const issues = validate(config, runner, shell);
  const fieldError = (field: string) => issues.find(issue => issue.field === field && issue.severity === 'error');
  const set = (patch: Partial<Config>) => onChange({ ...config, ...patch });
  const fresh = config.scenario === 'fresh';
  const toggleAgent = (agent: Agent) => set({ agents: config.agents.includes(agent) ? config.agents.filter(item => item !== agent) : sortAgents([...config.agents, agent]) });
  const toggleExtra = (extra: Extra) => set({ extras: config.extras.includes(extra) ? config.extras.filter(item => item !== extra) : sortExtras([...config.extras, extra]) });
  const examplePath = shell === 'powershell' ? 'C:\\Projects\\my-app' : '~/projects/my-app';

  const extraRow = (extra: Extra) => {
    const info = EXTRA_INFO[extra];
    const viaPreset = resolved.presetExtras.includes(extra);
    const checked = viaPreset || config.extras.includes(extra);
    const id = `${ids}-${extra}`;
    return <li key={extra} className="extra-row" data-checked={checked} data-locked={viaPreset}>
      <input id={id} type="checkbox" checked={checked} disabled={viaPreset} onChange={() => toggleExtra(extra)} aria-describedby={`${id}-adds`}/>
      <label htmlFor={id}>
        <span className="extra-title">{pick(language, info.title)}<code>--with-{extra}</code>
          {viaPreset && <span className="pill"><Icon name="lock" size={12}/>{t('via preset', 'из пресета')}</span>}
          {info.needs && <span className="pill subtle">{info.needs === 'claude' ? t('Claude Code', 'Claude Code') : 'Codex'}</span>}
        </span>
        <span id={`${id}-adds`} className="extra-adds">{pick(language, info.adds)}</span>
        <span className="extra-note">{pick(language, info.note)}</span>
      </label>
    </li>;
  };

  return <section id="configure" className="section configure-section" aria-labelledby="configure-title">
    <div className="section-head">
      <span className="eyebrow">{t('COMMAND BUILDER', 'КОНСТРУКТОР КОМАНДЫ')}</span>
      <h2 id="configure-title">{t('Configure once. Preview. Apply.', 'Настройте. Посмотрите. Примените.')}</h2>
      <p>{t('Every option maps to a real installer flag of AI-KIT. Commands are generated in your browser — nothing is sent anywhere.', 'Каждая опция — реальный флаг установщика AI-KIT. Команды собираются в браузере, ничего никуда не отправляется.')}</p>
    </div>
    <div className="config-layout">
      <form className="config-form" onSubmit={event => event.preventDefault()} aria-label={t('Installation options', 'Параметры установки')}>
        <div className="scenario-switch" role="radiogroup" aria-label={t('Scenario', 'Сценарий')}>
          {([['fresh', t('New installation', 'Новая установка'), t('Add AI-KIT to a project', 'Добавить AI-KIT в проект')],
            ['update', t('Update a project', 'Обновить проект'), t('Keep saved choices, change only what you pick', 'Сохранить выбор, менять только отмеченное')]] as const).map(([value, title, hint]) =>
            <label key={value} data-checked={config.scenario === value}>
              <input type="radio" name="scenario" value={value} checked={config.scenario === value}
                onChange={() => onChange(value === 'fresh' ? { ...freshDefaults(), target: config.target } : { ...updateDefaults(), target: config.target })}/>
              <strong>{title}</strong><small>{hint}</small>
            </label>)}
        </div>

        <Group index="01" title={t('Runner and project', 'Запуск и проект')}>
          <RunnerPicker runner={runner} shell={shell} onRunner={onRunner} onShell={onShell} t={t} language={language} compact/>
          <div className="field">
            <label htmlFor={`${ids}-target`}>{runner === 'docker' ? t('Application folder on the host', 'Папка приложения на хосте') : t('Application folder (TARGET)', 'Папка приложения (TARGET)')}</label>
            <input id={`${ids}-target`} className="text-input mono" value={config.target} spellCheck={false} autoComplete="off"
              aria-invalid={Boolean(fieldError('target'))} onChange={event => set({ target: event.target.value })}/>
            <div className="field-actions">
              <button type="button" className="chip-button" onClick={() => set({ target: '.' })}>. <span>{t('current folder', 'текущая папка')}</span></button>
              <button type="button" className="chip-button" onClick={() => set({ target: examplePath })}>{examplePath}</button>
            </div>
            <p className="field-hint">{runner === 'docker'
              ? t('Mounted at /workspace: read-only for the preview, writable for apply.', 'Монтируется в /workspace: только чтение для preview, запись — для apply.')
              : t('Run from your application folder with ., or give an absolute path. Quote-safe output is generated for you.', 'Запускайте из папки приложения с . или укажите абсолютный путь. Кавычки расставляются автоматически.')}</p>
          </div>
        </Group>

        <Group index="02" title={t('AI clients', 'AI-клиенты')}
          hint={fresh ? t('Repeat --agent for each client. Nothing selected means the default: Codex.', 'Для каждого клиента — свой --agent. Если ничего не выбрано — по умолчанию Codex.')
            : t('Leave empty to keep the saved clients. A selection replaces the saved list.', 'Оставьте пустым, чтобы сохранить текущих клиентов. Выбор заменяет сохранённый список.')}>
          <div className="agent-grid">
            {AGENTS.map(agent => {
              const checked = config.agents.includes(agent);
              return <label key={agent} className="agent-chip" data-checked={checked} title={pick(language, AGENT_INFO[agent].installs)}>
                <input type="checkbox" checked={checked} onChange={() => toggleAgent(agent)}/>
                <span className="agent-mark" aria-hidden="true">{AGENT_INFO[agent].name.slice(0, 2)}</span>
                <span className="agent-name">{AGENT_INFO[agent].name}<code>{agent}</code></span>
                <Icon name="check" size={15} className="agent-check"/>
              </label>;
            })}
          </div>
          <div className="field-actions">
            <button type="button" className="chip-button" onClick={() => set({ agents: ['codex', 'claude'] })}>Codex + Claude</button>
            <button type="button" className="chip-button" onClick={() => set({ agents: [...CURRENT_AGENTS] })}>{t(`All ${CURRENT_AGENTS.length}`, `Все ${CURRENT_AGENTS.length}`)}</button>
            <button type="button" className="chip-button" onClick={() => set({ agents: [] })}>{fresh ? t('Default (Codex)', 'По умолчанию (Codex)') : t('Keep saved', 'Оставить сохранённых')}</button>
          </div>
        </Group>

        <Group index="03" title={t('Preset and sharing', 'Пресет и доступ')}
          hint={t('A preset sets the sharing mode and five managed extras. Explicit --mode and --with-* flags win.', 'Пресет задаёт режим доступа и пять управляемых extras. Явные --mode и --with-* важнее.')}>
          <div className="preset-grid" role="radiogroup" aria-label={t('Preset', 'Пресет')}>
            {(['', ...PRESETS] as const).map(value => {
              const info = value ? PRESET_INFO[value as Preset] : null;
              return <label key={value || 'none'} className="preset-card" data-checked={config.preset === value}>
                <input type="radio" name="preset" value={value} checked={config.preset === value} onChange={() => set({ preset: value })}/>
                <span className="preset-name">{value || t('No preset', 'Без пресета')}
                  {info && <span className="pill subtle">{info.mode ?? t('keeps mode', 'режим не меняет')}</span>}</span>
                <span className="preset-summary">{info ? pick(language, info.summary) : fresh
                  ? t('Only the extras you pick below.', 'Только extras, выбранные ниже.')
                  : t('Keep the saved extras; add only what you pick.', 'Сохранить текущие extras и добавить выбранные.')}</span>
                {info && <span className="preset-dots" aria-hidden="true">{PRESET_EXTRAS.map(extra => <i key={extra} data-on={info.extras.includes(extra)}/>)}</span>}
              </label>;
            })}
          </div>
          <div className="field inline-field">
            <span className="field-label" id={`${ids}-mode`}>{t('Sharing mode', 'Режим доступа')}</span>
            <Segmented name="mode" label={t('Sharing mode', 'Режим доступа')} value={config.mode || 'auto'} onChange={value => set({ mode: value === 'auto' ? '' : value })}
              options={[
                { value: 'auto', label: config.preset && PRESET_INFO[config.preset].mode ? t(`Preset (${PRESET_INFO[config.preset].mode})`, `Пресет (${PRESET_INFO[config.preset].mode})`) : fresh ? t('Default (private)', 'По умолчанию (private)') : t('Keep saved', 'Как сохранено') },
                { value: 'private', label: 'private', hint: t('AI-KIT files stay local through the managed .gitignore block', 'Файлы AI-KIT остаются локальными через управляемый блок .gitignore') },
                { value: 'team', label: 'team', hint: t('Shared instructions visible to Git for teammates', 'Общие инструкции видны в Git для команды') },
              ]}/>
          </div>
          <p className="field-hint">{resolved.mode === 'team'
            ? t('team: shared instructions and context are visible to Git; local state, caches, secrets and personal overrides stay excluded. No commit or push is made.', 'team: общие инструкции и контекст видны в Git; локальное состояние, кэши, секреты и личные настройки исключены. Коммит и push не выполняются.')
            : resolved.mode === 'private'
              ? t('private: AI-KIT files and client configuration stay local via the managed .gitignore block. Already tracked files remain tracked.', 'private: файлы AI-KIT и конфигурация клиентов остаются локальными через управляемый блок .gitignore. Уже отслеживаемые файлы не исключаются.')
              : t('The saved sharing mode is kept.', 'Сохранённый режим доступа не меняется.')}</p>
        </Group>

        <Group index="04" title={t('Language, conventions and Docker cleanup', 'Язык, соглашения и очистка Docker')}>
          <div className="two-fields">
            <div className="field">
              <label htmlFor={`${ids}-language`}>{t('Chat language', 'Язык чата')} <code>--chat-language</code></label>
              <input id={`${ids}-language`} className="text-input" list={`${ids}-languages`} value={config.chatLanguage} maxLength={80}
                placeholder={fresh ? t('English (default)', 'English (по умолчанию)') : t('Keep saved', 'Как сохранено')}
                aria-invalid={Boolean(fieldError('chatLanguage'))} onChange={event => set({ chatLanguage: event.target.value })}/>
              <datalist id={`${ids}-languages`}>{LANGUAGE_SUGGESTIONS.map(name => <option key={name} value={name}/>)}</datalist>
              <p className="field-hint">{fresh
                ? t('Replies and plans use it; authored project files stay English. Since 1.6.0 the default is English; type Russian for Russian replies.', 'На нём агент отвечает и пишет планы; файлы проекта остаются на английском. С версии 1.6.0 по умолчанию English; для ответов на русском укажите Russian.')
                : t('The saved language is kept, including Russian. Set English or another language explicitly to change it.', 'Сохранённый язык не меняется, в том числе Russian. Чтобы сменить его, укажите English или другой язык явно.')}</p>
            </div>
            <div className="field">
              <span className="field-label">{t('Conventions', 'Соглашения')} <code>--conventions</code></span>
              <Segmented name="conventions" label={t('Conventions', 'Соглашения')} value={config.conventions || 'auto'} onChange={value => set({ conventions: value === 'auto' ? '' : value })}
                options={[{ value: 'auto', label: fresh ? t('Default', 'По умолч.') : t('Saved', 'Как есть') }, { value: 'owner', label: 'owner' }, { value: 'standard', label: 'standard' }]}/>
              <p className="field-hint">{(resolved.conventions ?? 'owner') === 'standard'
                ? t('standard: follow the project’s own conventions and the stack’s normal guidance.', 'standard: следовать соглашениям проекта и обычным правилам стека.')
                : <>{t('owner: opinionated Laravel rules (no DB foreign keys, Policy + Factory + Seeder per model, one table per migration). Public UUIDs are a separate --with-uuid option. ', 'owner: строгие правила Laravel (без внешних ключей в БД, Policy + Factory + Seeder на модель, одна таблица на миграцию). Публичные UUID — отдельная опция --with-uuid. ')}
                  <a className="text-link" href={sourceLink('template/ai-kit/profiles/OWNER.md')} target="_blank" rel="noopener noreferrer">OWNER.md<Icon name="external" size={12}/></a></>}</p>
            </div>
          </div>
          <div className="field inline-field">
            <span className="field-label">{t('Docker cleanup', 'Очистка Docker')} <code>--docker-cleanup</code></span>
            <Segmented name="docker-cleanup" label={t('Docker cleanup', 'Очистка Docker')} value={config.dockerCleanup || 'auto'} onChange={value => set({ dockerCleanup: value === 'auto' ? '' : value })}
              invalid={Boolean(fieldError('dockerCleanup'))}
              options={[
                { value: 'auto', label: fresh ? t('Default (maximum)', 'По умолчанию (maximum)') : t('Keep saved', 'Как сохранено') },
                { value: 'maximum', label: 'maximum', hint: pick(language, DOCKER_CLEANUP_INFO.maximum) },
                { value: 'keep-cache', label: 'keep-cache', hint: pick(language, DOCKER_CLEANUP_INFO['keep-cache']) },
              ]}/>
            <p className="field-hint">{resolved.dockerCleanup
              ? `${resolved.dockerCleanup}: ${pick(language, DOCKER_CLEANUP_INFO[resolved.dockerCleanup])} `
              : t('The saved cleanup mode is kept; an installation without the setting uses maximum. ', 'Сохранённый режим очистки не меняется; без этой настройки действует maximum. ')}
              {t('Agents follow it after Docker tasks; the installer itself runs no cleanup. Saved as docker_cleanup. ', 'Агенты следуют ему после Docker-задач; сам установщик ничего не очищает. Сохраняется как docker_cleanup. ')}
              <a className="text-link" href={guideLink('DOCKER', 'docker-cleanup-and-host-reclamation')} target="_blank" rel="noopener noreferrer">{t('Cleanup modes', 'Режимы очистки')}<Icon name="external" size={12}/></a></p>
          </div>
        </Group>

        <Group index="05" title={t('Optional extras', 'Дополнительные модули')}
          hint={fresh ? t('All switches. Selections persist in ai-kit/settings.json after apply.', 'Все — переключатели. После apply выбор сохраняется в ai-kit/settings.json.')
            : t('Omitting a flag on update does not disable a module; there are no --without-* flags.', 'Если не указать флаг при обновлении, модуль не выключится; флагов --without-* нет.')}>
          <h3 className="list-title">{t('Preset-managed', 'Управляются пресетами')}</h3>
          <ul className="extra-list">{PRESET_EXTRAS.map(extraRow)}</ul>
          <h3 className="list-title">{t('Independent modules', 'Независимые модули')}<span>{t('never changed by presets', 'пресеты их не меняют')}</span></h3>
          <ul className="extra-list">{MODULE_EXTRAS.map(extraRow)}</ul>
        </Group>

        <details className="config-group advanced">
          <summary><span className="group-index">06</span>{t('Advanced', 'Дополнительно')}<Icon name="chevron" size={16}/></summary>
          <label className="toggle-row">
            <input type="checkbox" checked={config.check} onChange={event => set({ check: event.target.checked })}/>
            <span><strong>{t('Run the doctor after apply', 'Запустить doctor после apply')} <code>--check</code></strong>
              <small>{t('Checks installed files after a successful apply. Without --apply it only previews.', 'Проверяет установленные файлы после успешного apply. Без --apply это только preview.')}</small></span>
          </label>
          <label className="toggle-row">
            <input type="checkbox" checked={config.interactive} onChange={event => set({ interactive: event.target.checked })}/>
            <span><strong>{t('Interactive wizard', 'Интерактивный мастер')} <code>--interactive</code></strong>
              <small>{t('Asks about preset, sharing, language, conventions, agents and extras, then asks to proceed. Flags above still take precedence.', 'Спрашивает пресет, доступ, язык, соглашения, агентов и extras, затем подтверждение. Флаги выше всё равно важнее.')}</small></span>
          </label>
          <div className="field">
            <label htmlFor={`${ids}-accept`}>{t('Accept reviewed local merges', 'Принять проверенные локальные слияния')} <code>--accept-local</code></label>
            <textarea id={`${ids}-accept`} className="text-input mono" rows={3} spellCheck={false} placeholder={'AGENTS.md\nai-kit/CORE.md'}
              aria-invalid={Boolean(fieldError('acceptLocal'))}
              value={config.acceptLocal.join('\n')} onChange={event => set({ acceptLocal: event.target.value.split('\n').slice(0, 20) })}/>
            <p className="field-hint">{t('One managed path per line, relative to the project. Use only after you merged the candidate from ai-kit/.upstream-cache/candidates/. Not a force-overwrite.', 'Один управляемый путь на строку, относительно проекта. Только после ручного слияния кандидата из ai-kit/.upstream-cache/candidates/. Это не принудительная перезапись.')}</p>
          </div>
          {!fresh && <label className="toggle-row">
            <input type="checkbox" checked={config.allowDowngrade} aria-invalid={Boolean(fieldError('allowDowngrade'))} onChange={event => set({ allowDowngrade: event.target.checked })}/>
            <span><strong>{t('Allow a deliberate downgrade', 'Разрешить осознанный откат')} <code>--allow-downgrade</code></strong>
              <small>{t('Safety override. When the project records a newer AI-KIT than this CLI, preview warns and apply refuses so older files cannot silently replace newer ones. Upgrade the CLI instead; tick this only to go back on purpose. Not saved.',
                'Отключение защиты. Если в проекте записана более новая версия AI-KIT, чем у этого CLI, preview предупреждает, а apply отказывается, чтобы старые файлы не заменили новые незаметно. Лучше обновите CLI; отмечайте это только для намеренного отката. Не сохраняется.')}</small></span>
          </label>}
        </details>
        <a className="jump-result" href="#result">{t('See the generated commands', 'К готовым командам')}<Icon name="arrow" size={16}/></a>
      </form>
      <ResultPanel config={config} runner={runner} shell={shell} issues={issues} t={t} language={language}
        onReset={() => onChange(config.scenario === 'update' ? updateDefaults() : freshDefaults())}/>
    </div>
  </section>;
}
