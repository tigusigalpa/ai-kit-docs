import { useId, useState, type ReactNode } from 'react';
import { FLAGS_COMMAND, guideLink, imageAtLeast, MCP_REPORT_AND_DOWNGRADE_GUARD, MODEL_EXCEPTIONS, readmeLink, TASK_WORKFLOW, UPSTREAM } from '../data/upstream';
import { doctorFix, flagsCommand, flagsOutputProblem, invocation, mcpReport, routeModelArgs, sessionSetup, targetToken, TASK_ACTIONS, TASK_STATES, taskCommand, taskProblem, versionCommand, type Mount, type TaskAction, type TaskState } from '../domain/command';
import type { Runner } from '../domain/config';
import { hasControlCharacters, quote, type Shell } from '../domain/shell';
import type { T } from '../i18n';
import { CodeBlock, Segmented } from './CodeBlock';
import { Icon } from './Icon';

type Tool = 'doctor' | 'mcp' | 'task' | 'route' | 'context' | 'providers' | 'flags' | 'check';
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
  const [toFile, setToFile] = useState(false);
  const [output, setOutput] = useState('installer-flags.json');
  const [modelIntent, setModelIntent] = useState<'' | 'current' | 'preserve'>('');
  const [modelName, setModelName] = useState('');
  const [taskAction, setTaskAction] = useState<TaskAction>('create');
  const [taskJson, setTaskJson] = useState('ai-kit/task.example.json');
  const [taskId, setTaskId] = useState('example-change');
  const [checkId, setCheckId] = useState('tests');
  const [taskTo, setTaskTo] = useState<TaskState>('implementing');
  const [taskApply, setTaskApply] = useState(false);
  const lang = shell === 'powershell' ? 'PowerShell' : 'Bash';
  const project = targetToken(runner, target, shell);

  let code = '';
  let error = '';
  let mount: Mount = 'none';
  let note: ReactNode = '';
  // A lagging published image rejects commands added after it.
  const imageLacks = (since: string, command: string) => runner === 'docker' && !imageAtLeast(since)
    ? t(`The published image is AI-KIT ${UPSTREAM.imageVersion}; ${command} needs AI-KIT ${since} or later. Use another runner.`,
      `Опубликованный образ — AI-KIT ${UPSTREAM.imageVersion}; для ${command} нужен AI-KIT ${since} или новее. Выберите другой способ запуска.`)
    : '';
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
          previewNote: t('--fix builds the installer repair plan from the saved choices to restore missing or baseline files and prints it, with the plan warnings, in the health report. Nothing is written.',
            '--fix строит план установщика по сохранённым настройкам, чтобы восстановить отсутствующие или базовые файлы, и печатает его вместе с предупреждениями плана в отчёте. Ничего не записывается.')
            // The published image already previews; a pip or source CLI can still be older than that change.
            + (runner === 'docker' ? '' : t(' AI-KIT 1.4.5 and earlier write with --fix alone, so check the CLI version first.', ' AI-KIT 1.4.5 и более ранние версии записывают уже с одним --fix, поэтому сначала проверьте версию CLI.')),
          apply: plan.apply,
          applyNote: t('--apply writes the reviewed plan and is refused without --fix. Local edits are preserved; conflicts still need review. Exit code 2: conflicts or doctor errors remain. Exit code 1: refused, for example when the project records a newer AI-KIT than this CLI (1.5.0+); upgrade the CLI first.',
            '--apply записывает проверенный план; без --fix он отклоняется. Локальные правки сохраняются, конфликты всё равно требуют проверки. Код выхода 2 — остались конфликты или ошибки doctor. Код 1 — отказ, например если в проекте записана более новая версия AI-KIT, чем у этого CLI (1.5.0+); сначала обновите CLI.'),
        };
        break;
      }
      code = invocation(runner, shell, 'doctor', [project], mount);
      note = t('Reports managed-file, link, provider and context drift for an installed project. Writes nothing. Since 1.5.0 it names the upgrade commands when this CLI carries a newer AI-KIT than the project, and warns when the CLI is older than the installation.',
        'Показывает расхождения управляемых файлов, ссылок, провайдеров и контекста. Ничего не пишет. С версии 1.5.0 подсказывает команды обновления, если у этого CLI более новый AI-KIT, чем в проекте, и предупреждает, если CLI старше установки.');
      break;
    case 'mcp':
      error = imageLacks(MCP_REPORT_AND_DOWNGRADE_GUARD, 'mcp report');
      mount = 'readonly';
      code = mcpReport(runner, shell, target);
      note = <>{t('Read-only JSON inventory of MCP servers in the project’s client files: .mcp.json (Claude Code), .cursor/mcp.json, .vscode/mcp.json (VS Code/Copilot), .gemini/settings.json, .codex/config.toml, .roo/mcp.json and .kimi-code/mcp.json. Per server: transport, command, URL origin, variable names, approval and tool settings, and whether the file is tracked in Git. Secret values are never printed; warnings flag literal credentials, inline OAuth client secrets, credentials in URLs, plain HTTP to remote hosts and auto-approval. No server is started, contacted or authorized. Windsurf and Cline keep MCP servers in user-level files, which it does not read.',
        'JSON-список MCP-серверов из файлов клиентов в проекте, только чтение: .mcp.json (Claude Code), .cursor/mcp.json, .vscode/mcp.json (VS Code/Copilot), .gemini/settings.json, .codex/config.toml, .roo/mcp.json и .kimi-code/mcp.json. Для каждого сервера: транспорт, команда, origin URL, имена переменных, настройки подтверждения и инструментов, отслеживается ли файл в Git. Значения секретов не выводятся; предупреждения отмечают секреты прямо в файле, встроенные OAuth client secret, учётные данные в URL, обычный HTTP к удалённым хостам и автоподтверждение. Ни один сервер не запускается, не вызывается и не авторизуется. Windsurf и Cline хранят MCP-серверы в файлах пользователя, их отчёт не читает.')}
        {runner === 'docker' ? '' : t(' With Python 3.10, .codex/config.toml shows server names only.', ' На Python 3.10 из .codex/config.toml видны только имена серверов.')}{' '}
        <a className="text-link" href={guideLink('INSTALL', 'review-mcp-servers')} target="_blank" rel="noopener noreferrer">{t('MCP review guide', 'Руководство по проверке MCP')}<Icon name="external" size={12}/></a></>;
      break;
    case 'route': {
      if (!task.trim() || hasControlCharacters(task)) error = t('Describe the task in one line.', 'Опишите задачу одной строкой.');
      const model = modelName.trim();
      if (modelIntent) {
        if (!model || model.length > 160 || hasControlCharacters(model) || model.startsWith('-')) error = t('Enter the model name or ID, up to 160 characters, not starting with a dash.', 'Укажите имя или ID модели до 160 символов, не с дефиса.');
        else if (shell === 'powershell' && model.includes('"')) error = t('Remove double quotes: Windows PowerShell does not pass them reliably to native programs.', 'Уберите двойные кавычки: Windows PowerShell ненадёжно передаёт их внешним программам.');
        else error ||= imageLacks(MODEL_EXCEPTIONS, modelIntent === 'current' ? 'route --current-model' : 'route --preserve-model');
      }
      mount = withProject ? 'readonly' : 'none';
      const args = [quote(task, shell)];
      if (routeMode) args.push('--mode', routeMode);
      if (profile) args.push('--profile', profile);
      args.push(...routeModelArgs(modelIntent, modelName, shell));
      if (withProject) args.push('--project', project);
      code = invocation(runner, shell, 'route', args, mount);
      note = <>{t('Offline: recommends a capability level 0–6, role and effort, and explains why. English and Russian task text work. It recommends; it never fakes a model switch. With --project it follows that project’s model_switching_enabled and protected models (1.8.0+).',
        'Офлайн: рекомендует уровень 0–6, роль и effort и объясняет выбор. Понимает задачи на английском и русском. Только рекомендует и не имитирует переключение модели. С --project учитывает model_switching_enabled и защищённые модели проекта (1.8.0+).')}
        {modelIntent === 'preserve' && t(' --preserve-model keeps that model and effort for this call only and writes nothing: the report says explicit_preservation and execution_verified false.', ' --preserve-model сохраняет эту модель и effort только для этого вызова и ничего не пишет: в отчёте explicit_preservation и execution_verified false.')}
        {modelIntent === 'current' && t(' --current-model declares the model you are on (not telemetry): a protected model gets no model or effort advice (model_exception); other models keep the usual advice.', ' --current-model сообщает, на какой модели вы работаете (это не телеметрия): для защищённой модели советов по модели и effort нет (model_exception), для остальных советы обычные.')}{' '}
        <a className="text-link" href={readmeLink('conditional-exceptions-and-quick-model-preservation')} target="_blank" rel="noopener noreferrer">{t('Model exceptions', 'Исключения моделей')}<Icon name="external" size={12}/></a></>;
      break;
    }
    case 'task': {
      const request = { action: taskAction, json: taskJson, taskId, checkId, to: taskTo, apply: taskApply };
      const problem = taskProblem(runner, shell, request);
      error = imageLacks(TASK_WORKFLOW, 'task') || (problem ? {
        json: t('Enter the path of the task or review JSON file.', 'Укажите путь к JSON-файлу задачи или ревью.'),
        'docker-path': t('In Docker the JSON file is read from the mounted application folder: use a relative path without ..', 'В Docker JSON-файл читается из смонтированной папки приложения: укажите относительный путь без ..'),
        'task-id': t('Task ID: lowercase letters, digits, - and _, starting with a letter or digit, up to 64 characters.', 'ID задачи: строчные буквы, цифры, - и _, начинается с буквы или цифры, до 64 символов.'),
        'check-id': t('Check ID: lowercase letters, digits, - and _, as declared in the task.', 'ID проверки: строчные буквы, цифры, - и _, как в описании задачи.'),
        'powershell-quote': t('Remove double quotes: Windows PowerShell does not pass them reliably to native programs.', 'Уберите двойные кавычки: Windows PowerShell ненадёжно передаёт их внешним программам.'),
      }[problem] : '');
      mount = taskApply && taskAction !== 'status' ? 'writable' : 'readonly';
      code = taskCommand(runner, shell, target, request);
      const notes: Record<TaskAction, string> = {
        create: t('Registers the task from its JSON definition: objective, constraints, acceptance criteria and checks as argv arrays. An identical repeat keeps the existing state.', 'Регистрирует задачу из JSON: цель, ограничения, критерии приёмки и проверки в виде массивов argv. Повтор с тем же описанием сохраняет состояние.'),
        revise: t('Changed requirements: the same task ID gets a new revision, returns to planned and needs a new implementation and check cycle. History is kept.', 'Изменились требования: тот же ID задачи получает новую ревизию, возвращается в planned и требует нового цикла реализации и проверок. История сохраняется.'),
        status: t('Read-only: state, revision, current fingerprint and check receipts. After a source change an accepted task shows effective_state stale.', 'Только чтение: состояние, ревизия, текущий fingerprint и квитанции проверок. После изменения кода принятая задача показывает effective_state stale.'),
        transition: t('Moves along planned → implementing → checking → reviewing → awaiting_approval → accepted, or to failed or cancelled. Reviewing needs current passing checks.', 'Переводит по цепочке planned → implementing → checking → reviewing → awaiting_approval → accepted или в failed/cancelled. Для reviewing нужны актуальные успешные проверки.'),
        check: t('Without --apply it prints the declared command; with --apply it runs it in the Git working tree and binds the receipt to the task revision, HEAD, index and files. Checks run locally with your permissions, not in a sandbox.', 'Без --apply печатает объявленную команду; с --apply запускает её в рабочем дереве Git и привязывает квитанцию к ревизии задачи, HEAD, индексу и файлам. Проверки идут локально с вашими правами, без песочницы.'),
        accept: t('Accepts the exact checked version: the review JSON carries the current fingerprint, the reviewer and evidence for every criterion. Keep it under ai-kit/.tasks/reviews/ so it does not change the fingerprint. Grants no commit or deploy permission.', 'Принимает ровно проверенную версию: JSON ревью содержит текущий fingerprint, ревьюера и доказательства по каждому критерию. Храните его в ai-kit/.tasks/reviews/, чтобы он не менял fingerprint. Права на коммит и деплой не даёт.'),
      };
      note = <>{notes[taskAction]}{' '}
        {t('Needs --with-task-workflow (1.7.0+) in the project. Exit codes: 0 done, 1 a check did not pass, 2 invalid input or refused.', 'Нужен --with-task-workflow (1.7.0+) в проекте. Коды выхода: 0 — готово, 1 — проверка не прошла, 2 — неверный ввод или отказ.')}
        {runner === 'docker' && taskAction === 'check' && taskApply && t(' In Docker the check runs inside the AI-KIT image, which has Python and Git but not your project toolchain; prefer a host runner.', ' В Docker проверка выполняется внутри образа AI-KIT, где есть Python и Git, но нет инструментов вашего проекта; лучше запускать с хоста.')}{' '}
        <a className="text-link" href={readmeLink('optional-task-workflow-requirements-states-and-checks-tied-to-code')} target="_blank" rel="noopener noreferrer">{t('Task workflow guide', 'Руководство по задачам')}<Icon name="external" size={12}/></a></>;
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
    case 'flags': {
      error = imageLacks(FLAGS_COMMAND, 'flags');
      const problem = toFile ? flagsOutputProblem(runner, shell, output) : null;
      if (problem) error = {
        empty: t('Enter a file name for --output.', 'Укажите имя файла для --output.'),
        invalid: t('Enter a file name, not a folder or a value starting with a dash.', 'Укажите имя файла, а не папку и не значение с дефисом в начале.'),
        'docker-path': t('In Docker the file is written into the mounted application folder: use a relative path without ..', 'В Docker файл пишется в смонтированную папку приложения: укажите относительный путь без ..'),
        'powershell-quote': t('Remove double quotes: Windows PowerShell does not pass them reliably to native programs.', 'Уберите двойные кавычки: Windows PowerShell ненадёжно передаёт их внешним программам.'),
      }[problem];
      mount = toFile && runner === 'docker' ? 'writable' : 'none';
      code = flagsCommand(runner, shell, toFile ? output : undefined);
      note = t('Prints every aikit install option as JSON (schema 1): value type, choices, repeatability, exclusions, saved setting, fresh default, help text and presets. Reads no project and installs nothing; documentation tools such as this site build their option lists from it.',
        'Печатает все опции aikit install в JSON (schema 1): тип значения, варианты, повторяемость, исключения, сохраняемую настройку, значение по умолчанию, справку и пресеты. Проект не читает и ничего не устанавливает; документация, например этот сайт, строит по ней списки опций.')
        + (!toFile ? '' : runner === 'docker'
          ? t(' --output writes the file with LF line endings into the mounted application folder.', ' --output записывает файл с окончаниями строк LF в смонтированную папку приложения.')
          : t(' --output writes the file with LF line endings; a relative path starts from the current folder.', ' --output записывает файл с окончаниями строк LF; относительный путь отсчитывается от текущей папки.'));
      break;
    }
    case 'check':
      code = `${invocation(runner, shell, 'check', [])}\n${versionCommand(runner, shell)}`;
      note = t('check validates the bundled AI-KIT distribution itself, not your application. Use doctor for a project.', 'check проверяет сам дистрибутив AI-KIT, а не ваше приложение. Для проекта используйте doctor.');
      break;
  }
  const setup = sessionSetup(runner, shell, target);
  const tools: { value: Tool; label: string }[] = [
    { value: 'doctor', label: 'doctor' }, { value: 'mcp', label: 'mcp report' }, { value: 'task', label: 'task' }, { value: 'route', label: 'route' },
    { value: 'context', label: 'context select' }, { value: 'providers', label: 'providers' }, { value: 'flags', label: 'flags' },
    { value: 'check', label: 'check' },
  ];
  return <section id="commands" className="section commands-section" aria-labelledby="commands-title">
    <div className="section-head">
      <span className="eyebrow">{t('AFTER INSTALLATION', 'ПОСЛЕ УСТАНОВКИ')}</span>
      <h2 id="commands-title">{t('Keep the project healthy.', 'Поддерживайте проект в форме.')}</h2>
      <p>{t('Health checks, MCP review, tasks with source-bound checks, model routing, scoped context and the flag schema use the same runner and project folder you picked above.', 'Проверки, обзор MCP, задачи с проверками, привязанными к коду, маршрутизация моделей, выбор контекста и схема флагов используют тот же способ запуска и папку проекта, что выбраны выше.')}</p>
    </div>
    <div className="commands-card">
      <Segmented name="tool" label={t('Command', 'Команда')} value={tool} onChange={setTool} options={tools}/>
      <div className="tool-fields">
        {tool === 'doctor' && <label className="toggle-row inline"><input type="checkbox" checked={fix} onChange={event => setFix(event.target.checked)}/>
          <span><strong>{t('Restore missing files', 'Восстановить отсутствующие файлы')} <code>--fix</code></strong>
            <small>{t('Preview the repair plan first, then write the reviewed plan.', 'Сначала preview плана восстановления, затем запись проверенного плана.')}</small></span></label>}
        {tool === 'flags' && <>
          <label className="toggle-row inline"><input type="checkbox" checked={toFile} onChange={event => setToFile(event.target.checked)}/>
            <span><strong>{t('Write to a file', 'Записать в файл')} <code>--output</code></strong>
              <small>{t('Otherwise the JSON is printed.', 'Иначе JSON печатается в консоль.')}</small></span></label>
          {toFile && <div className="field"><label htmlFor={`${ids}-output`}>--output</label>
            <input id={`${ids}-output`} className="text-input mono" value={output} spellCheck={false} autoComplete="off" maxLength={300}
              aria-invalid={Boolean(toFile && flagsOutputProblem(runner, shell, output))} onChange={event => setOutput(event.target.value)}/></div>}
        </>}
        {tool === 'route' && <>
          <div className="field wide"><label htmlFor={`${ids}-task`}>{t('Task description', 'Описание задачи')}</label>
            <input id={`${ids}-task`} className="text-input" value={task} maxLength={300} onChange={event => setTask(event.target.value)}/></div>
          <div className="field"><label htmlFor={`${ids}-mode`}>--mode</label>
            <select id={`${ids}-mode`} className="text-input" value={routeMode} onChange={event => setRouteMode(event.target.value as typeof routeMode)}>
              {ROUTE_MODES.map(value => <option key={value} value={value}>{value || t('default', 'по умолчанию')}</option>)}</select></div>
          <div className="field"><label htmlFor={`${ids}-profile`}>--profile</label>
            <select id={`${ids}-profile`} className="text-input" value={profile} onChange={event => setProfile(event.target.value as typeof profile)}>
              {PROFILES.map(value => <option key={value} value={value}>{value || t('default', 'по умолчанию')}</option>)}</select></div>
          <div className="field"><label htmlFor={`${ids}-intent`}>{t('Model intent', 'Модель')}</label>
            <select id={`${ids}-intent`} className="text-input" value={modelIntent} onChange={event => setModelIntent(event.target.value as typeof modelIntent)}>
              <option value="">{t('none', 'не указывать')}</option>
              <option value="current">--current-model</option>
              <option value="preserve">--preserve-model</option></select></div>
          {modelIntent && <div className="field"><label htmlFor={`${ids}-model`}>{t('Model name or ID', 'Имя или ID модели')}</label>
            <input id={`${ids}-model`} className="text-input mono" value={modelName} maxLength={200} spellCheck={false} placeholder="Astra" onChange={event => setModelName(event.target.value)}/></div>}
          <label className="toggle-row inline"><input type="checkbox" checked={withProject} onChange={event => setWithProject(event.target.checked)}/>
            <span><strong>{t('Use project settings and history', 'Учитывать настройки и историю проекта')} <code>--project</code></strong></span></label>
        </>}
        {tool === 'task' && <>
          <div className="field"><label htmlFor={`${ids}-task-action`}>{t('Action', 'Действие')}</label>
            <select id={`${ids}-task-action`} className="text-input" value={taskAction} onChange={event => setTaskAction(event.target.value as TaskAction)}>
              {TASK_ACTIONS.map(value => <option key={value} value={value}>{value}</option>)}</select></div>
          {taskAction !== 'create' && taskAction !== 'revise' && <div className="field"><label htmlFor={`${ids}-task-id`}>--task-id</label>
            <input id={`${ids}-task-id`} className="text-input mono" value={taskId} maxLength={64} spellCheck={false} onChange={event => setTaskId(event.target.value.trim())}/></div>}
          {(taskAction === 'create' || taskAction === 'revise' || taskAction === 'accept') && <div className="field"><label htmlFor={`${ids}-task-json`}>--from-json</label>
            <input id={`${ids}-task-json`} className="text-input mono" value={taskJson} maxLength={300} spellCheck={false} onChange={event => setTaskJson(event.target.value)}/></div>}
          {taskAction === 'transition' && <div className="field"><label htmlFor={`${ids}-task-to`}>--to</label>
            <select id={`${ids}-task-to`} className="text-input" value={taskTo} onChange={event => setTaskTo(event.target.value as TaskState)}>
              {TASK_STATES.map(value => <option key={value} value={value}>{value}</option>)}</select></div>}
          {taskAction === 'check' && <div className="field"><label htmlFor={`${ids}-check-id`}>--check-id</label>
            <input id={`${ids}-check-id`} className="text-input mono" value={checkId} maxLength={64} spellCheck={false} onChange={event => setCheckId(event.target.value.trim())}/></div>}
          {taskAction !== 'status' && <label className="toggle-row inline"><input type="checkbox" checked={taskApply} onChange={event => setTaskApply(event.target.checked)}/>
            <span><strong>{t('Write the state', 'Записать состояние')} <code>--apply</code></strong>
              <small>{taskAction === 'check' ? t('Runs the declared command.', 'Запускает объявленную команду.') : t('Otherwise only a preview.', 'Иначе только preview.')}</small></span></label>}
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
