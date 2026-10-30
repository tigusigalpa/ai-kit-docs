import { useId, useState } from 'react';
import { AGENTS, EXTRA_INFO, EXTRAS, PRESET_EXTRAS, PRESET_INFO, PRESETS, settingsKey, type Text } from '../data/catalog';
import { readmeLink } from '../data/upstream';
import { pick, type Language, type T } from '../i18n';
import { Icon } from './Icon';

interface Flag { flag: string; value: Text; does: Text; fallback: Text }

const MAIN_FLAGS: Flag[] = [
  { flag: 'TARGET', value: ['Directory, e.g. . or "C:\\Projects\\my-app"', 'Папка, например . или "C:\\Projects\\my-app"'], does: ['The application to initialize or update. Quote paths with spaces.', 'Приложение, которое нужно настроить или обновить. Пути с пробелами — в кавычках.'], fallback: ['Required every time; never inferred.', 'Обязателен всегда; не угадывается.'] },
  { flag: '--apply', value: ['Switch', 'Переключатель'], does: ['Writes the plan: instructions, adapters, settings and the ignore block.', 'Записывает план: инструкции, адаптеры, настройки и блок ignore.'], fallback: ['Omitted: preview only, nothing written.', 'Без него: только preview, ничего не пишется.'] },
  { flag: '--dry-run', value: ['Switch', 'Переключатель'], does: ['Explicitly requests the same read-only preview.', 'Явно запрашивает тот же preview только для чтения.'], fallback: ['Cannot be combined with --apply.', 'Нельзя сочетать с --apply.'] },
  { flag: '--check', value: ['Switch', 'Переключатель'], does: ['Runs the project doctor after a successful --apply.', 'Запускает doctor проекта после успешного --apply.'], fallback: ['Without --apply it still only previews.', 'Без --apply это всё равно только preview.'] },
  { flag: '--interactive', value: ['Switch', 'Переключатель'], does: ['Asks about preset, sharing, language, conventions, agents and extras, then confirms.', 'Спрашивает пресет, доступ, язык, соглашения, агентов и extras, затем подтверждение.'], fallback: ['Writing still needs --apply.', 'Для записи всё равно нужен --apply.'] },
  { flag: '--mode', value: ['private | team', 'private | team'], does: ['Git visibility of installed AI-KIT instructions and configuration.', 'Видимость установленных инструкций и конфигурации AI-KIT в Git.'], fallback: ['Fresh: private; upgrade: saved. Wins over a preset.', 'Новая: private; обновление: сохранённый. Важнее пресета.'] },
  { flag: '--agent', value: ['One client; repeat the flag', 'Один клиент; повторяйте флаг'], does: ['Selects client adapters, e.g. --agent codex --agent claude.', 'Выбирает адаптеры клиентов, например --agent codex --agent claude.'], fallback: ['Fresh: codex; upgrade: saved. An explicit list replaces it.', 'Новая: codex; обновление: сохранённый. Явный список заменяет его.'] },
  { flag: '--chat-language', value: ['Name up to 60 characters', 'Название до 60 символов'], does: ['Language of chat replies and plans. Project files stay English.', 'Язык ответов и планов в чате. Файлы проекта — на английском.'], fallback: ['Fresh: Russian; upgrade: saved.', 'Новая: Russian; обновление: сохранённый.'] },
  { flag: '--conventions', value: ['owner | standard', 'owner | standard'], does: ['Stack-specific coding preferences; never replaces Core security rules.', 'Предпочтения по стеку; не заменяют правила безопасности Core.'], fallback: ['Fresh: owner; upgrade: saved.', 'Новая: owner; обновление: сохранённые.'] },
  { flag: '--preset', value: ['minimal | solo | team | strict', 'minimal | solo | team | strict'], does: ['Applies a bundle of sharing and managed extras; can turn managed extras off.', 'Применяет набор режима и управляемых extras; может их выключить.'], fallback: ['Omitted: nothing reapplied. Explicit flags win.', 'Без него: ничего не переприменяется. Явные флаги важнее.'] },
  { flag: '--accept-local', value: ['Managed path relative to TARGET; repeatable', 'Управляемый путь от TARGET; можно повторять'], does: ['Records an explicitly reviewed semantic merge without replacing the file.', 'Фиксирует проверенное слияние без замены файла.'], fallback: ['Not a force-overwrite; not for project-owned files.', 'Не принудительная перезапись; не для файлов проекта.'] },
  { flag: '-h, --help', value: ['Switch', 'Переключатель'], does: ['Prints install options and exits.', 'Печатает опции install и завершает работу.'], fallback: ['aikit --help lists commands.', 'aikit --help — список команд.'] },
];

export function Reference({ t, language }: { t: T; language: Language }) {
  const ids = useId();
  const [query, setQuery] = useState('');
  const moduleFlags: Flag[] = EXTRAS.map(extra => ({
    flag: `--with-${extra}`, value: ['Switch', 'Переключатель'], does: EXTRA_INFO[extra].adds,
    fallback: [`Saved as ${settingsKey(extra)}. ${EXTRA_INFO[extra].note[0]}`, `Сохраняется как ${settingsKey(extra)}. ${EXTRA_INFO[extra].note[1]}`],
  }));
  const needle = query.trim().toLowerCase();
  const rows = [...MAIN_FLAGS, ...moduleFlags].filter(row => !needle || [row.flag, ...row.value, ...row.does, ...row.fallback].join(' ').toLowerCase().includes(needle));
  return <section id="reference" className="section reference-section" aria-labelledby="reference-title">
    <div className="section-head">
      <span className="eyebrow">{t('REFERENCE', 'СПРАВОЧНИК')}</span>
      <h2 id="reference-title">{t('Every installer flag, explained.', 'Все флаги установщика — с пояснениями.')}</h2>
      <p>{t('For aikit install TARGET [OPTIONS]. Identical for python -m aikit.aikit_cli install, scripts/install.py and the Docker image.', 'Для aikit install TARGET [OPTIONS]. Так же для python -m aikit.aikit_cli install, scripts/install.py и Docker-образа.')}</p>
    </div>
    <div className="reference-tools">
      <label className="search" htmlFor={`${ids}-search`}><span className="sr-only">{t('Filter flags', 'Фильтр флагов')}</span>
        <input id={`${ids}-search`} className="text-input" type="search" placeholder={t('Filter: agent, guards, team, settings…', 'Фильтр: agent, guards, team, settings…')} value={query} onChange={event => setQuery(event.target.value)}/>
      </label>
      <span className="result-count" role="status">{rows.length} / {MAIN_FLAGS.length + moduleFlags.length}</span>
    </div>
    <div className="table-wrap">
      <table className="flag-table">
        <thead><tr><th scope="col">{t('Flag', 'Флаг')}</th><th scope="col">{t('Value', 'Значение')}</th><th scope="col">{t('What it does', 'Что делает')}</th><th scope="col">{t('Default · upgrade', 'По умолчанию · обновление')}</th></tr></thead>
        <tbody>{rows.map(row => <tr key={row.flag}>
          <th scope="row"><code>{row.flag}</code></th><td>{pick(language, row.value)}</td><td>{pick(language, row.does)}</td><td>{pick(language, row.fallback)}</td>
        </tr>)}</tbody>
      </table>
      {!rows.length && <p className="empty">{t('No flag matches this filter.', 'Под фильтр ни один флаг не подходит.')}</p>}
    </div>
    <div className="reference-grid">
      <div className="ref-card">
        <h3>{t('Presets at a glance', 'Пресеты кратко')}</h3>
        <div className="table-wrap">
          <table className="matrix">
            <thead><tr><th scope="col">{t('Preset', 'Пресет')}</th><th scope="col">{t('Mode', 'Режим')}</th>{PRESET_EXTRAS.map(extra => <th key={extra} scope="col"><span>{extra}</span></th>)}</tr></thead>
            <tbody>{PRESETS.map(preset => <tr key={preset}>
              <th scope="row"><code>{preset}</code></th>
              <td>{PRESET_INFO[preset].mode ?? t('keeps', 'как есть')}</td>
              {PRESET_EXTRAS.map(extra => <td key={extra} data-on={PRESET_INFO[preset].extras.includes(extra)}>
                {PRESET_INFO[preset].extras.includes(extra) ? <Icon name="check" size={16}/> : <span aria-label={t('off', 'выкл')}>—</span>}</td>)}
            </tr>)}</tbody>
          </table>
        </div>
        <p className="ref-note">{t('CI, security-audit, Strix, Context7, Web Design and orchestration stay outside presets.', 'CI, security-audit, Strix, Context7, Web Design и оркестрация не входят в пресеты.')}</p>
      </div>
      <div className="ref-card">
        <h3>{t('Valid --agent names', 'Допустимые --agent')}</h3>
        <p className="token-list">{[...AGENTS].sort().map(agent => <code key={agent}>{agent}</code>)}</p>
        <p className="ref-note">{t('Lowercase. Repeat the flag: --agent codex --agent claude, not --agent codex,claude.', 'В нижнем регистре. Повторяйте флаг: --agent codex --agent claude, а не --agent codex,claude.')}</p>
        <h3>{t('Exit codes', 'Коды выхода')}</h3>
        <dl className="exit-codes"><div><dt>0</dt><dd>{t('success', 'успех')}</dd></div><div><dt>1</dt><dd>{t('refusal', 'отказ')}</dd></div><div><dt>2</dt><dd>{t('unresolved conflicts', 'неразрешённые конфликты')}</dd></div></dl>
        <a className="text-link" href={readmeLink('installer-flags-and-options')} target="_blank" rel="noopener noreferrer">{t('Full README reference', 'Полный справочник в README')}<Icon name="external" size={13}/></a>
      </div>
    </div>
  </section>;
}
