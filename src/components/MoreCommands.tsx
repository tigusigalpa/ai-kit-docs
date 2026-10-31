import { useId, useState } from 'react';
import { UPSTREAM } from '../data/upstream';
import { doctorFix, invocation, sessionSetup, targetToken, versionCommand, type Mount } from '../domain/command';
import type { Runner } from '../domain/config';
import { hasControlCharacters, quote, type Shell } from '../domain/shell';
import type { T } from '../i18n';
import { CodeBlock, Segmented } from './CodeBlock';

type Tool = 'doctor' | 'route' | 'context' | 'providers' | 'check';
const ROUTE_MODES = ['', 'manual', 'fixed', 'recommended', 'adaptive'] as const;
const PROFILES = ['', 'economy', 'balanced', 'quality'] as const;
const WORKFLOWS = ['', 'web-design', 'ui-review', 'design-extract'] as const;

export function MoreCommands({ runner, shell, target, t }: { runner: Runner; shell: Shell; target: string; t: T }) {
  const ids = useId();
  const [tool, setTool] = useState<Tool>('doctor');
  const [fix, setFix] = useState(false);
  const [task, setTask] = useState('debug a race condition in the queue worker');
  const [routeMode, setRouteMode] = useState<typeof ROUTE_MODES[number]>('');
  const [profile, setProfile] = useState<typeof PROFILES[number]>('');
  const [withProject, setWithProject] = useState(false);
  const [modulePath, setModulePath] = useState('api');
  const [budget, setBudget] = useState('32000');
  const [workflow, setWorkflow] = useState<typeof WORKFLOWS[number]>('');
  const lang = shell === 'powershell' ? 'PowerShell' : 'Bash';
  const project = targetToken(runner, target, shell);

  let code = '';
  let error = '';
  let mount: Mount = 'none';
  let note = '';
  // doctor --fix runs as two steps: a preview of the repair plan, then the write.
  let repair: { preview: string; previewNote: string; apply: string; applyNote: string } | null = null;
  switch (tool) {
    case 'doctor':
      mount = 'readonly';
      if (fix) {
        const plan = doctorFix(runner, shell, target);
        mount = 'writable';
        repair = plan.legacyImage ? {
          preview: plan.preview,
          previewNote: t(`The published image is AI-KIT ${UPSTREAM.imageVersion}: its doctor has no preview. The installer preview without options builds the same repair plan from the saved choices and writes nothing.`,
            `Опубликованный образ — AI-KIT ${UPSTREAM.imageVersion}: в его doctor нет preview. Preview установщика без опций строит тот же план восстановления по сохранённым настройкам и ничего не пишет.`),
          apply: plan.apply,
          applyNote: t(`In image ${UPSTREAM.imageVersion}, --fix writes immediately and --apply is not accepted. Local edits are preserved; conflicts still need review. Exit code 2: conflicts or doctor errors remain.`,
            `В образе ${UPSTREAM.imageVersion} --fix записывает сразу, а --apply не принимается. Локальные правки сохраняются, конфликты всё равно требуют проверки. Код выхода 2 — остались конфликты или ошибки doctor.`),
        } : {
          preview: plan.preview,
          previewNote: t('--fix builds the installer repair plan from the saved choices to restore missing or baseline files and prints it with the health report. Nothing is written. AI-KIT 1.4.5 and earlier write with --fix alone, so check the CLI version first.',
            '--fix строит план установщика по сохранённым настройкам, чтобы восстановить отсутствующие или базовые файлы, и печатает его вместе с отчётом. Ничего не записывается. AI-KIT 1.4.5 и более ранние версии записывают уже с одним --fix, поэтому сначала проверьте версию CLI.'),
          apply: plan.apply,
          applyNote: t('--apply writes the reviewed plan and is refused without --fix. Local edits are preserved; conflicts still need review. Exit code 2: conflicts or doctor errors remain.',
            '--apply записывает проверенный план; без --fix он отклоняется. Локальные правки сохраняются, конфликты всё равно требуют проверки. Код выхода 2 — остались конфликты или ошибки doctor.'),
        };
        break;
      }
      code = invocation(runner, shell, 'doctor', [project], mount);
      note = t('Reports managed-file, link, provider and context drift for an installed project. Writes nothing.', 'Показывает расхождения управляемых файлов, ссылок, провайдеров и контекста. Ничего не пишет.');
      break;
    case 'route': {
      if (!task.trim() || hasControlCharacters(task)) error = t('Describe the task in one line.', 'Опишите задачу одной строкой.');
      mount = withProject ? 'readonly' : 'none';
      const args = [quote(task, shell)];
      if (routeMode) args.push('--mode', routeMode);
      if (profile) args.push('--profile', profile);
      if (withProject) args.push('--project', project);
      code = invocation(runner, shell, 'route', args, mount);
      note = t('Offline: recommends a capability level 0–6, role and effort, and explains why. English and Russian task text work. It recommends; it never fakes a model switch.', 'Офлайн: рекомендует уровень 0–6, роль и effort и объясняет выбор. Понимает задачи на английском и русском. Только рекомендует и не имитирует переключение модели.');
      break;
    }
    case 'context': {
      const value = Number(budget);
      if (!/^\d+$/.test(budget) || value < 1) error = t('Budget must be a positive number of bytes.', 'Бюджет — положительное число байт.');
      if (hasControlCharacters(modulePath) || modulePath.trim().startsWith('-')) error = t('Enter a relative module path.', 'Укажите относительный путь модуля.');
      mount = 'readonly';
      const args = [project, '--path', quote(modulePath.trim() || '.', shell), '--budget', budget];
      if (workflow) args.push('--workflow', workflow);
      code = invocation(runner, shell, 'context select', args, mount);
      note = t('Read-only manifest of module rules with duplicate detection and byte accounting; critical requirements survive any budget.', 'Манифест правил модуля только для чтения: поиск дублей и учёт байтов; критичные требования сохраняются при любом бюджете.');
      break;
    }
    case 'providers':
      code = invocation(runner, shell, 'providers', []);
      note = t('Lists each routing provider with its tier, status and verification sources.', 'Список провайдеров маршрутизации с уровнем, статусом и источниками проверки.');
      break;
    case 'check':
      code = `${invocation(runner, shell, 'check', [])}\n${versionCommand(runner, shell)}`;
      note = t('check validates the bundled AI-KIT distribution itself, not your application. Use doctor for a project.', 'check проверяет сам дистрибутив AI-KIT, а не ваше приложение. Для проекта используйте doctor.');
      break;
  }
  const setup = sessionSetup(runner, shell, target);
  const tools: { value: Tool; label: string }[] = [
    { value: 'doctor', label: 'doctor' }, { value: 'route', label: 'route' }, { value: 'context', label: 'context select' },
    { value: 'providers', label: 'providers' }, { value: 'check', label: 'check' },
  ];
  return <section id="commands" className="section commands-section" aria-labelledby="commands-title">
    <div className="section-head">
      <span className="eyebrow">{t('AFTER INSTALLATION', 'ПОСЛЕ УСТАНОВКИ')}</span>
      <h2 id="commands-title">{t('Keep the project healthy.', 'Поддерживайте проект в форме.')}</h2>
      <p>{t('Health checks, model routing and scoped context use the same runner and project folder you picked above.', 'Проверки, маршрутизация моделей и выбор контекста используют тот же способ запуска и папку проекта, что выбраны выше.')}</p>
    </div>
    <div className="commands-card">
      <Segmented name="tool" label={t('Command', 'Команда')} value={tool} onChange={setTool} options={tools}/>
      <div className="tool-fields">
        {tool === 'doctor' && <label className="toggle-row inline"><input type="checkbox" checked={fix} onChange={event => setFix(event.target.checked)}/>
          <span><strong>{t('Restore missing files', 'Восстановить отсутствующие файлы')} <code>--fix</code></strong>
            <small>{t('Preview the repair plan first, then write the reviewed plan.', 'Сначала preview плана восстановления, затем запись проверенного плана.')}</small></span></label>}
        {tool === 'route' && <>
          <div className="field wide"><label htmlFor={`${ids}-task`}>{t('Task description', 'Описание задачи')}</label>
            <input id={`${ids}-task`} className="text-input" value={task} maxLength={300} onChange={event => setTask(event.target.value)}/></div>
          <div className="field"><label htmlFor={`${ids}-mode`}>--mode</label>
            <select id={`${ids}-mode`} className="text-input" value={routeMode} onChange={event => setRouteMode(event.target.value as typeof routeMode)}>
              {ROUTE_MODES.map(value => <option key={value} value={value}>{value || t('default', 'по умолчанию')}</option>)}</select></div>
          <div className="field"><label htmlFor={`${ids}-profile`}>--profile</label>
            <select id={`${ids}-profile`} className="text-input" value={profile} onChange={event => setProfile(event.target.value as typeof profile)}>
              {PROFILES.map(value => <option key={value} value={value}>{value || t('default', 'по умолчанию')}</option>)}</select></div>
          <label className="toggle-row inline"><input type="checkbox" checked={withProject} onChange={event => setWithProject(event.target.checked)}/>
            <span><strong>{t('Use project history', 'Учитывать историю проекта')} <code>--project</code></strong></span></label>
        </>}
        {tool === 'context' && <>
          <div className="field"><label htmlFor={`${ids}-path`}>--path</label>
            <input id={`${ids}-path`} className="text-input mono" value={modulePath} onChange={event => setModulePath(event.target.value)}/></div>
          <div className="field"><label htmlFor={`${ids}-budget`}>--budget</label>
            <input id={`${ids}-budget`} className="text-input mono" inputMode="numeric" value={budget} onChange={event => setBudget(event.target.value.trim())}/></div>
          <div className="field"><label htmlFor={`${ids}-workflow`}>--workflow</label>
            <select id={`${ids}-workflow`} className="text-input" value={workflow} onChange={event => setWorkflow(event.target.value as typeof workflow)}>
              {WORKFLOWS.map(value => <option key={value} value={value}>{value || t('none', 'нет')}</option>)}</select></div>
        </>}
      </div>
      <div className="command-stack">
        {setup && runner === 'docker' && mount === 'none'
          ? <CodeBlock t={t} code={setup.split('\n').filter(line => !line.startsWith('app_path') && !line.startsWith('$appPath')).join('\n')} lang={lang} step="··" tone="muted" title={t('Session setup', 'Настройка сессии')}/>
          : setup && <CodeBlock t={t} code={setup} lang={lang} step="··" tone="muted" title={t('Session setup', 'Настройка сессии')}/>}
        {error ? <p className="blocked">{error}</p> : repair ? <>
          <CodeBlock t={t} code={repair.preview} lang={lang} step="01" title={t('Preview the repair plan — writes nothing', 'Preview плана восстановления — ничего не пишет')}>{repair.previewNote}</CodeBlock>
          <CodeBlock t={t} code={repair.apply} lang={lang} step="02" tone="apply" title={t('Write the reviewed repair plan', 'Записать проверенный план восстановления')}>{repair.applyNote}</CodeBlock>
        </> : <CodeBlock t={t} code={code} lang={lang} title={tools.find(item => item.value === tool)?.label}>{note}</CodeBlock>}
      </div>
    </div>
  </section>;
}
