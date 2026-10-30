import { CLEANUP_AND_FIX_PREVIEW, guideLink, imageAtLeast, UPSTREAM } from '../data/upstream';
import type { Runner } from '../domain/config';
import type { Shell } from '../domain/shell';
import type { Language, T } from '../i18n';
import { CodeBlock } from './CodeBlock';
import { Icon } from './Icon';
import { RunnerPicker } from './RunnerPicker';

interface Step { title: string; code: string; note?: string }

const PATH_REFRESH = `$savedUserPath = [Environment]::GetEnvironmentVariable('Path', 'User')
foreach ($entry in ($savedUserPath -split ';')) {
    if ([string]::IsNullOrWhiteSpace($entry)) { continue }
    $expandedEntry = [Environment]::ExpandEnvironmentVariables($entry.Trim().Trim('"'))
    $processEntries = @($env:Path -split ';' | ForEach-Object { $_.Trim().Trim('"').TrimEnd('\\') })
    if ($processEntries -notcontains $expandedEntry.TrimEnd('\\')) {
        $env:Path = $env:Path.TrimEnd(';') + ';' + $expandedEntry
    }
}
Get-Command aikit -CommandType Application
aikit --version`;

function steps(runner: Runner, shell: Shell, t: T): Step[] {
  const ps = shell === 'powershell';
  const py = ps ? 'python' : 'python3';
  switch (runner) {
    case 'aikit': return ps ? [
      { title: t('Check Python 3.10+ and pip', 'Проверьте Python 3.10+ и pip'), code: 'python --version\npython -m pip --version' },
      { title: t('Install or update the package', 'Установите или обновите пакет'), code: `python -m pip install --upgrade ${UPSTREAM.package}` },
      { title: t('Verify the command', 'Проверьте команду'), code: 'aikit --version', note: t('If PowerShell reports that aikit is not recognized, pick “python -m” above, or refresh PATH in this window (below).', 'Если PowerShell пишет, что aikit не найден, выберите «python -m» выше или обновите PATH в этом окне (ниже).') },
    ] : [
      { title: t('Check Python 3.10+', 'Проверьте Python 3.10+'), code: 'python3 --version' },
      { title: t('Install with pipx (isolated)', 'Установите через pipx (изолированно)'), code: `pipx install ${UPSTREAM.package}`, note: t(`Update later with pipx upgrade ${UPSTREAM.package}.`, `Обновление: pipx upgrade ${UPSTREAM.package}.`) },
      { title: t('Verify the command', 'Проверьте команду'), code: 'aikit --version' },
    ];
    case 'module': return [
      { title: t('Check Python 3.10+ and pip', 'Проверьте Python 3.10+ и pip'), code: `${py} --version\n${py} -m pip --version` },
      { title: t('Install with the same interpreter', 'Установите тем же интерпретатором'), code: `${py} -m pip install --upgrade ${UPSTREAM.package}`, note: ps ? undefined : t('If your distribution marks the system Python as externally managed, choose pipx or the isolated venv instead.', 'Если дистрибутив помечает системный Python как externally managed, выберите pipx или изолированный venv.') },
      { title: t('Run through the module entry point', 'Запускайте через модуль'), code: `${py} -m aikit.aikit_cli --version`, note: t('The module entry point works even when the shell cannot find aikit on PATH.', 'Запуск через модуль работает, даже если оболочка не находит aikit в PATH.') },
    ];
    case 'venv': return ps ? [
      { title: t('Create a user-owned environment', 'Создайте окружение в профиле пользователя'), code: `$cliEnv = Join-Path $env:LOCALAPPDATA 'AI-KIT\\venv'\npython -m venv "$cliEnv"` },
      { title: t('Install into it', 'Установите в него пакет'), code: `& "$cliEnv\\Scripts\\python.exe" -m pip install --upgrade ${UPSTREAM.package}` },
      { title: t('Verify without activation', 'Проверьте без активации'), code: '& "$cliEnv\\Scripts\\aikit.exe" --version', note: t('No Activate.ps1 and no execution-policy change. A new PowerShell window needs the $cliEnv line again.', 'Без Activate.ps1 и без смены execution policy. В новом окне PowerShell снова выполните строку с $cliEnv.') },
    ] : [
      { title: t('Create a user-owned environment', 'Создайте окружение в профиле пользователя'), code: 'cli_env="$HOME/.local/share/ai-kit/venv"\npython3 -m venv "$cli_env"' },
      { title: t('Install into it', 'Установите в него пакет'), code: `"$cli_env/bin/python" -m pip install --upgrade ${UPSTREAM.package}` },
      { title: t('Verify without activation', 'Проверьте без активации'), code: '"$cli_env/bin/aikit" --version', note: t('A new terminal needs the cli_env line again.', 'В новом терминале снова выполните строку с cli_env.') },
    ];
    case 'docker': return [
      { title: t('Check the Docker context and daemon', 'Проверьте Docker-контекст и демон'), code: 'docker context show\ndocker version' },
      { title: t('Pull the published image', 'Скачайте опубликованный образ'), code: `docker pull ${UPSTREAM.image}`, note: imageAtLeast(CLEANUP_AND_FIX_PREVIEW)
        ? t('Published platform: linux/amd64. The image bundles Python, Git, the CLI and templates.', 'Платформа: linux/amd64. В образе есть Python, Git, CLI и шаблоны.')
        : t(`Published platform: linux/amd64. The image bundles Python, Git, the CLI and templates. The latest published image is ${UPSTREAM.imageVersion}; it does not include the ${CLEANUP_AND_FIX_PREVIEW} changes such as --docker-cleanup and the doctor --fix preview.`,
          `Платформа: linux/amd64. В образе есть Python, Git, CLI и шаблоны. Последний опубликованный образ — ${UPSTREAM.imageVersion}; изменений ${CLEANUP_AND_FIX_PREVIEW}, например --docker-cleanup и preview для doctor --fix, в нём нет.`) },
      { title: t('Try the CLI', 'Проверьте CLI'), code: `docker run --rm ${UPSTREAM.image} --help`, note: t('Each command exits when done; there is no server to keep running.', 'Каждая команда завершается сама; держать сервер запущенным не нужно.') },
    ];
    case 'source': return [
      { title: t('Clone the repository', 'Клонируйте репозиторий'), code: `git clone ${UPSTREAM.repository}.git\ncd ai-kit` },
      { title: t('Use the reviewed release', 'Переключитесь на проверенный релиз'), code: `git checkout ${UPSTREAM.tag}` },
      { title: t('Check the installer', 'Проверьте установщик'), code: `${py} scripts/install.py --help`, note: t('Run commands from this folder and pass an absolute path to your application outside it.', 'Запускайте команды из этой папки и передавайте абсолютный путь к приложению вне её.') },
    ];
  }
}

export function InstallGuide({ runner, shell, onRunner, onShell, t, language }: {
  runner: Runner; shell: Shell; onRunner: (runner: Runner) => void; onShell: (shell: Shell) => void; t: T; language: Language;
}) {
  const list = steps(runner, shell, t);
  const lang = shell === 'powershell' ? 'PowerShell' : 'Bash';
  return <section id="install" className="section install-section" aria-labelledby="install-title">
    <div className="section-head">
      <span className="eyebrow">{t('STEP ZERO · GET THE CLI', 'ШАГ НОЛЬ · УСТАНОВИТЕ CLI')}</span>
      <h2 id="install-title">{t('Install AI-KIT your way.', 'Установите AI-KIT удобным способом.')}</h2>
      <p>{t('Python 3.10+ with zero runtime dependencies, or a ready-made Docker image. Pick how you want to run it — the configurator below uses the same choice.', 'Python 3.10+ без runtime-зависимостей или готовый Docker-образ. Выберите способ запуска — конструктор ниже использует тот же выбор.')}</p>
    </div>
    <RunnerPicker runner={runner} shell={shell} onRunner={onRunner} onShell={onShell} t={t} language={language}/>
    <div className="install-grid">
      <ol className="install-steps">
        {list.map((step, index) => <li key={step.title}>
          <CodeBlock code={step.code} t={t} step={String(index + 1).padStart(2, '0')} title={step.title} lang={lang}>{step.note}</CodeBlock>
        </li>)}
      </ol>
      <aside className="install-aside">
        <div className="aside-card">
          <h3><Icon name="info" size={18}/>{t('Good to know', 'Полезно знать')}</h3>
          <ul>
            <li>{t('Package ', 'Пакет ')}<code>{UPSTREAM.package}</code>{t(', command ', ', команда ')}<code>aikit</code>{t(', module ', ', модуль ')}<code>aikit.aikit_cli</code>.</li>
            <li>{t('The installer works offline and writes nothing until you add ', 'Установщик работает офлайн и ничего не пишет, пока вы не добавите ')}<code>--apply</code>.</li>
            <li>{t('Updating the CLI does not touch projects: update each project with its own preview and apply.', 'Обновление CLI не меняет проекты: каждый проект обновляется своим preview и apply.')}</li>
          </ul>
          <a className="text-link" href={guideLink('WINDOWS')} target="_blank" rel="noopener noreferrer">{t('Windows troubleshooting guide', 'Решение проблем в Windows')}<Icon name="external" size={14}/></a>
        </div>
        {runner === 'aikit' && shell === 'powershell' && <details className="aside-card path-fix">
          <summary>{t('“aikit is not recognized”: refresh PATH in this window', '«aikit не распознан»: обновить PATH в этом окне')}</summary>
          <p>{t('Imports saved user PATH entries into the current PowerShell process only. Reopen the hosting terminal or editor for future sessions.', 'Добавляет сохранённые пользовательские записи PATH только в текущий процесс PowerShell. Для новых сессий перезапустите терминал или редактор целиком.')}</p>
          <CodeBlock code={PATH_REFRESH} t={t} title={t('Current window only', 'Только текущее окно')} lang="PowerShell"/>
        </details>}
        <a className="button primary block" href="#configure">{t('Next: build your install command', 'Дальше: собрать команду установки')}<Icon name="arrow" size={18}/></a>
      </aside>
    </div>
  </section>;
}
