import { useState } from 'react';
import { AGENT_INFO, type Agent } from '../data/catalog';
import { CLEANUP_AND_FIX_PREVIEW, imageAtLeast, readmeLink, UPSTREAM } from '../data/upstream';
import { installCommand, sessionSetup, upgradeCommand } from '../domain/command';
import { hasErrors, resolve, settingsPreview, type Config, type Issue, type Runner } from '../domain/config';
import { footprint, footprintVersion } from '../domain/footprint';
import { encode } from '../domain/share';
import type { Shell } from '../domain/shell';
import { issueText, type Language, type T } from '../i18n';
import { CodeBlock, copyText } from './CodeBlock';
import { FileTree } from './FileTree';
import { Icon } from './Icon';

type Tab = 'commands' | 'settings' | 'files';

const OTHER_CLIENT_PROMPT = 'Read AGENTS.md and ai-kit/BOOTSTRAP.md, then bootstrap AI-KIT for this project: confirm the installer drafts and fill PROJECT_CONTEXT.md and ai-kit/project.json from verified repository evidence. Here is what I am building, the intended stack and my constraints: ...';

function Bootstrap({ agents, t }: { agents: Agent[] | null; t: T }) {
  const list = agents ?? [];
  const others = list.filter(agent => !AGENT_INFO[agent].bootstrap);
  return <div className="bootstrap">
    <div className="bootstrap-head"><span className="code-step">03</span><strong>{t('Bootstrap in your AI client', 'Bootstrap в AI-клиенте')}</strong></div>
    <p>{t('Open the project in the client and send the skill in its chat — this is not a shell command. Tell it what you are building, the stack and your constraints.', 'Откройте проект в клиенте и отправьте skill в его чат — это не команда оболочки. Расскажите, что вы делаете, какой стек и какие ограничения.')}</p>
    <ul className="bootstrap-list">
      {(agents === null ? ['codex', 'claude'] as Agent[] : list.filter(agent => AGENT_INFO[agent].bootstrap)).map(agent =>
        <li key={agent}><span>{AGENT_INFO[agent].name}</span><code>{AGENT_INFO[agent].bootstrap}</code></li>)}
    </ul>
    {others.length > 0 && <CodeBlock t={t} code={OTHER_CLIENT_PROMPT} tone="muted"
      title={`${others.map(agent => AGENT_INFO[agent].name).join(', ')} · ${t('prompt', 'промпт')}`}/>}
  </div>;
}

export function ResultPanel({ config, runner, shell, issues, t, language, onReset }: {
  config: Config; runner: Runner; shell: Shell; issues: Issue[]; t: T; language: Language; onReset: () => void;
}) {
  const [tab, setTab] = useState<Tab>('commands');
  const [shared, setShared] = useState('');
  const resolved = resolve(config);
  const blocked = hasErrors(issues);
  const lang = shell === 'powershell' ? 'PowerShell' : 'Bash';
  const setup = sessionSetup(runner, shell, config.target);
  const files = footprint(resolved.agents ?? ['codex'], resolved.extras, resolved.mode ?? 'private');
  const settings = JSON.stringify(settingsPreview(config), null, 2);
  const share = async () => {
    const url = `${location.origin}${location.pathname}?${encode({ config, runner, shell })}#configure`;
    history.replaceState(null, '', url);
    setShared(await copyText(url) ? t('Link copied', 'Ссылка скопирована') : t('Link is in the address bar', 'Ссылка в адресной строке'));
    window.setTimeout(() => setShared(''), 2400);
  };
  const tabs: [Tab, string][] = [['commands', t('Commands', 'Команды')], ['settings', 'settings.json'], ['files', `${t('Files', 'Файлы')} · ${files.length}`]];
  return <aside id="result" className="result-panel" aria-label={t('Generated commands', 'Сгенерированные команды')}>
    <div className="result-tabs" role="tablist" aria-label={t('Result views', 'Вид результата')}>
      {tabs.map(([value, label]) => <button key={value} type="button" role="tab" id={`tab-${value}`} aria-selected={tab === value}
        aria-controls={`panel-${value}`} tabIndex={tab === value ? 0 : -1} onClick={() => setTab(value)}
        onKeyDown={event => {
          if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
          const index = tabs.findIndex(([item]) => item === tab);
          const next = tabs[(index + (event.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length][0];
          setTab(next);
          document.getElementById(`tab-${next}`)?.focus();
        }}>{label}</button>)}
    </div>
    <div className="result-body" role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
      {issues.length > 0 && tab === 'commands' && <ul className="issues" aria-live="polite">
        {issues.map(issue => <li key={issue.code + (issue.detail ?? '')} data-severity={issue.severity}>
          <Icon name={issue.severity === 'info' ? 'info' : 'alert'} size={16}/><span>{issueText(issue, language)}</span>
        </li>)}
      </ul>}
      {tab === 'commands' && (blocked
        ? <p className="blocked">{t('Fix the highlighted fields to generate commands.', 'Исправьте отмеченные поля, чтобы получить команды.')}</p>
        : <div className="command-stack">
          {config.scenario === 'update' && <CodeBlock t={t} code={upgradeCommand(runner, shell)} lang={lang} step="00" tone="muted"
            title={t('Update the CLI first (optional)', 'Сначала обновите CLI (по желанию)')}>
            <>{t('This updates the CLI only. The project is updated by the preview and apply below. A CLI older than the AI-KIT version the project records warns in preview and refuses to apply (since 1.5.0), so update it first.',
              'Это обновляет только CLI. Сам проект обновят preview и apply ниже. CLI старше версии AI-KIT, записанной в проекте, предупреждает в preview и отказывается применять изменения (начиная с 1.5.0), поэтому сначала обновите его.')} <a className="text-link" href={readmeLink('update-ai-kit')} target="_blank" rel="noopener noreferrer">{t('Update guide', 'Как обновлять')}<Icon name="external" size={12}/></a></></CodeBlock>}
          {setup && <CodeBlock t={t} code={setup} lang={lang} step="··" tone="muted" title={t('Session setup — once per terminal', 'Настройка сессии — раз на терминал')}/>}
          <CodeBlock t={t} code={installCommand(config, runner, shell, 'preview')} lang={lang} step="01" title={t('Preview — writes nothing', 'Preview — ничего не пишет')}>
            {t('Review writes, conflicts, adapter_conflicts, warnings and extras in the JSON plan.', 'Проверьте в JSON-плане writes, conflicts, adapter_conflicts, warnings и extras.')}</CodeBlock>
          <CodeBlock t={t} code={installCommand(config, runner, shell, 'apply')} lang={lang} step="02" tone="apply" title={t('Apply the reviewed plan', 'Применить проверенный план')}>
            {config.check
              ? t('Exit codes: 0 success, 1 refusal or doctor errors after the writes succeeded, 2 unresolved conflicts. Existing project documents are never overwritten.', 'Коды выхода: 0 успех, 1 отказ или ошибки doctor после успешной записи, 2 неразрешённые конфликты. Существующие документы проекта не перезаписываются.')
              : t('Exit codes: 0 success, 1 refusal, 2 unresolved conflicts. Existing project documents are never overwritten.', 'Коды выхода: 0 успех, 1 отказ, 2 неразрешённые конфликты. Существующие документы проекта не перезаписываются.')}</CodeBlock>
          <Bootstrap agents={resolved.agents} t={t}/>
        </div>)}
      {tab === 'settings' && <div className="command-stack">
        <CodeBlock t={t} code={settings} lang="JSON" title="ai-kit/settings.json"/>
        <p className="panel-note">{config.scenario === 'update'
          ? t('Shown for a fresh installation. On update, omitted values keep what is already saved.', 'Показано для новой установки. При обновлении неуказанные значения остаются как сохранено.')
          : t('Exactly what a fresh apply writes, in the same key order. Module selections persist here.', 'Ровно то, что запишет новая установка, в том же порядке ключей. Выбор модулей сохраняется здесь.')}
          {runner === 'docker' && !imageAtLeast(CLEANUP_AND_FIX_PREVIEW) && t(` The ${UPSTREAM.image} image writes no docker_cleanup key; absent means maximum.`, ` Образ ${UPSTREAM.image} не записывает ключ docker_cleanup; без него действует maximum.`)}</p>
      </div>}
      {tab === 'files' && <div className="command-stack">
        <FileTree files={files} t={t}/>
        <p className="panel-note">{t('Preview of an empty folder with AI-KIT ', 'Preview для пустой папки с AI-KIT ')}{footprintVersion}{t('. Existing README, CHANGELOG and context files are preserved; scoped rules appear per detected module.', '. Существующие README, CHANGELOG и файлы контекста сохраняются; правила по модулям появляются для найденных модулей.')}</p>
      </div>}
    </div>
    <div className="result-actions">
      <button type="button" className="button ghost small" onClick={share}><Icon name="link" size={15}/>{t('Copy share link', 'Скопировать ссылку')}</button>
      <button type="button" className="button ghost small" onClick={onReset}><Icon name="reset" size={15}/>{t('Reset', 'Сбросить')}</button>
      <span className="share-status" role="status">{shared}</span>
    </div>
  </aside>;
}
