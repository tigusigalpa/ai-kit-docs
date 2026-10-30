import { useEffect, useState } from 'react';
import { Configurator } from './components/Configurator';
import { Faq } from './components/Faq';
import { Features } from './components/Features';
import { Icon, Logo } from './components/Icon';
import { InstallGuide } from './components/InstallGuide';
import { MoreCommands } from './components/MoreCommands';
import { Reference } from './components/Reference';
import { AGENT_INFO, AGENTS, PRESET_INFO } from './data/catalog';
import { sourceLink, UPSTREAM } from './data/upstream';
import { freshDefaults, type Config, type Runner } from './domain/config';
import { footprint } from './domain/footprint';
import { decode } from './domain/share';
import type { Shell } from './domain/shell';
import { translator, type Language } from './i18n';

type Theme = 'light' | 'dark';

const stored = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const store = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* storage is optional */ } };

const initialLanguage = (): Language => {
  const fromQuery = new URLSearchParams(location.search).get('hl');
  if (fromQuery === 'ru' || fromQuery === 'en') return fromQuery;
  const saved = stored('ai-kit-docs:language');
  if (saved === 'ru' || saved === 'en') return saved;
  return navigator.language.toLowerCase().startsWith('ru') ? 'ru' : 'en';
};
const initialTheme = (): Theme | null => {
  const saved = stored('ai-kit-docs:theme');
  return saved === 'light' || saved === 'dark' ? saved : null;
};
const detectShell = (): Shell => /win/i.test(navigator.userAgent) && !/darwin|mac/i.test(navigator.userAgent) ? 'powershell' : 'posix';

const shared = decode(location.search);
const heroFiles = footprint(['codex', 'claude'], PRESET_INFO.solo.extras, 'private');

export default function App() {
  const [language, setLanguage] = useState<Language>(initialLanguage);
  const [theme, setTheme] = useState<Theme | null>(initialTheme);
  const [runner, setRunner] = useState<Runner>(shared?.runner ?? 'aikit');
  const [shell, setShell] = useState<Shell>(shared?.shell ?? detectShell());
  const [config, setConfig] = useState<Config>(shared?.config ?? freshDefaults());
  const [menuOpen, setMenuOpen] = useState(false);
  const t = translator(language);

  useEffect(() => { document.documentElement.lang = language; store('ai-kit-docs:language', language); }, [language]);
  useEffect(() => {
    if (theme) { document.documentElement.dataset.theme = theme; store('ai-kit-docs:theme', theme); }
    else delete document.documentElement.dataset.theme;
  }, [theme]);
  useEffect(() => {
    if (shared && location.hash === '#configure') document.getElementById('configure')?.scrollIntoView({ behavior: 'instant' });
  }, []);

  const effectiveTheme: Theme = theme ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const nav: [string, string][] = [
    ['#install', t('Install', 'Установка')], ['#configure', t('Configurator', 'Конструктор')], ['#commands', t('Commands', 'Команды')],
    ['#features', t('Features', 'Возможности')], ['#reference', t('Flags', 'Флаги')], ['#faq', 'FAQ'],
  ];
  const previewWrites = heroFiles.filter(file => ['AGENTS.md', 'CLAUDE.md', 'PROJECT_CONTEXT.md'].includes(file));

  return <>
    <a className="skip-link" href="#configure">{t('Skip to the configurator', 'Перейти к конструктору')}</a>
    <header className="site-header" data-open={menuOpen}>
      <div className="header-inner">
        <a className="brand" href="#top" aria-label="AI-KIT"><Logo size={34}/><span>AI-KIT</span><span className="brand-label">{t('docs & configurator', 'документация и конструктор')}</span></a>
        <nav id="site-nav" aria-label={t('Main navigation', 'Главная навигация')}>
          {nav.map(([href, label]) => <a key={href} href={href} onClick={() => setMenuOpen(false)}>{label}</a>)}
          <a className="github-link" href={UPSTREAM.repository} target="_blank" rel="noopener noreferrer"><Icon name="github" size={17}/><span>GitHub</span></a>
        </nav>
        <div className="header-tools">
          <button type="button" className="icon-button" onClick={() => setTheme(effectiveTheme === 'dark' ? 'light' : 'dark')}
            aria-label={effectiveTheme === 'dark' ? t('Switch to light theme', 'Включить светлую тему') : t('Switch to dark theme', 'Включить тёмную тему')}>
            <Icon name={effectiveTheme === 'dark' ? 'sun' : 'moon'} size={18}/>
          </button>
          <button type="button" className="language-button" onClick={() => setLanguage(language === 'en' ? 'ru' : 'en')}
            aria-label={language === 'en' ? 'Переключить на русский' : 'Switch to English'}>
            <span data-active={language === 'en'}>EN</span><span data-active={language === 'ru'}>RU</span>
          </button>
          <button type="button" className="icon-button menu-button" aria-expanded={menuOpen} aria-controls="site-nav" onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? t('Close menu', 'Закрыть меню') : t('Open menu', 'Открыть меню')}><Icon name={menuOpen ? 'close' : 'menu'} size={20}/></button>
        </div>
      </div>
    </header>

    <main id="top">
      <section className="hero">
        <div className="hero-copy">
          <a className="release-chip" href={`${UPSTREAM.repository}/blob/${UPSTREAM.tag}/CHANGELOG.md`} target="_blank" rel="noopener noreferrer">
            <span className="badge">v{UPSTREAM.version}</span>{t('GitHub release ', 'релиз на GitHub ')}{UPSTREAM.released}{t(' · Docker image ', ' · Docker-образ ')}{UPSTREAM.imageVersion}<Icon name="arrow" size={14}/>
          </a>
          <h1>{t('Stop re-explaining your project to ', 'Хватит заново объяснять проект ')}<span className="highlight">{t('every new AI chat.', 'каждому новому AI-чату.')}</span></h1>
          <p className="lead">{t('AI-KIT gives your coding agents persistent project memory, expert stack rules, adaptive model routing and native configuration for 11 AI clients. One offline installer, zero dependencies, every change previewed before you apply it.',
            'AI-KIT даёт вашим агентам постоянную память о проекте, экспертные правила для стека, адаптивную маршрутизацию моделей и родные настройки для 11 AI-клиентов. Один офлайн-установщик, ноль зависимостей, любое изменение — сначала в preview.')}</p>
          <div className="hero-actions">
            <a className="button primary" href="#configure">{t('Build your install command', 'Собрать команду установки')}<Icon name="arrow" size={18}/></a>
            <a className="button ghost" href="#install"><Icon name="terminal" size={18}/>{t('Install the CLI', 'Установить CLI')}</a>
          </div>
          <ul className="hero-facts">
            <li><Icon name="check" size={15}/>Python 3.10+</li>
            <li><Icon name="check" size={15}/>{t('Zero runtime dependencies', 'Без runtime-зависимостей')}</li>
            <li><Icon name="check" size={15}/>{t('Works offline', 'Работает офлайн')}</li>
            <li><Icon name="check" size={15}/>MIT</li>
          </ul>
        </div>
        <div className="hero-visual" aria-label={t('Illustration of an installer preview', 'Иллюстрация preview установщика')} role="img">
          <div className="terminal">
            <div className="terminal-bar"><span className="lights"><i/><i/><i/></span><span>~/projects/my-app</span><span className="terminal-tag">preview</span></div>
            <div className="terminal-body" aria-hidden="true">
              <p className="line l1"><span className="prompt">$</span> aikit install . <span className="flag">--preset</span> solo <span className="flag">--agent</span> codex <span className="flag">--agent</span> claude</p>
              <pre className="line l2">{`{
  "version": `}<span className="str">"{UPSTREAM.version}"</span>{`,
  "mode": `}<span className="str">"private"</span>{`,
  "preview": `}<span className="kw">true</span>{`,
  "writes": [`}{previewWrites.map(file => <span key={file}>{'\n    '}<span className="str">"{file}"</span>,</span>)}{`
    `}<span className="dim">… {heroFiles.length - previewWrites.length} {t('more', 'ещё')}</span>{`
  ],
  "conflicts": [],
  "extras": [`}<span className="str">"native-settings"</span>, <span className="str">"scoped-rules"</span>, <span className="str">"session-start"</span>{`]
}`}</pre>
              <p className="line l3"><span className="prompt">$</span> aikit install . <span className="dim">…</span> <span className="flag">--apply --check</span></p>
            </div>
          </div>
          <div className="float-card chat-card" aria-hidden="true">
            <span className="chat-avatar"><Icon name="sparkle" size={16}/></span>
            <div><small>Claude Code</small><code>/ai-kit-bootstrap</code></div>
          </div>
          <div className="float-card memory-float" aria-hidden="true">
            <Icon name="memory" size={18}/>
            <div><strong>PROJECT_CONTEXT.md</strong><small>{t('verified facts, read first', 'проверенные факты, читаются первыми')}</small></div>
          </div>
        </div>
      </section>

      <div className="clients-strip" aria-label={t('Supported AI clients', 'Поддерживаемые AI-клиенты')}>
        <span className="strip-label">{t('WORKS WITH', 'РАБОТАЕТ С')}</span>
        <ul>{AGENTS.map(agent => <li key={agent}>{AGENT_INFO[agent].name}</li>)}</ul>
      </div>

      <section className="section how-section" aria-labelledby="how-title">
        <div className="section-head">
          <span className="eyebrow">{t('THREE STEPS', 'ТРИ ШАГА')}</span>
          <h2 id="how-title">{t('Preview. Apply. Bootstrap.', 'Preview. Apply. Bootstrap.')}</h2>
        </div>
        <ol className="how-steps">
          <li><span className="how-index">01</span><h3>{t('Preview', 'Preview')}</h3>
            <p>{t('See every write, preserved file, conflict and detected stack. Nothing is written.', 'Видно каждую запись, сохраняемый файл, конфликт и найденный стек. Ничего не пишется.')}</p><code>aikit install .</code></li>
          <li><span className="how-index">02</span><h3>{t('Apply', 'Apply')}</h3>
            <p>{t('Repeat the same command to write the reviewed plan and check the result.', 'Повторите ту же команду, чтобы записать проверенный план и проверить результат.')}</p><code>… --apply --check</code></li>
          <li><span className="how-index">03</span><h3>{t('Bootstrap', 'Bootstrap')}</h3>
            <p>{t('Your agent confirms the drafts and fills project memory from real evidence.', 'Агент подтверждает черновики и заполняет память проекта по реальным фактам.')}</p><code>/ai-kit-bootstrap</code></li>
        </ol>
      </section>

      <div className="release-note">
        <span className="badge">v{UPSTREAM.version}</span>
        <p>{t('New: identical LF text in Git, PyPI and Docker distributions; an install-free --with-ci check of committed files; the docker_cleanup setting (maximum or keep-cache); doctor --fix now previews and --fix --apply writes; SIGTERM handling as container PID 1; hash-pinned release builds.',
          'Новое: одинаковый текст с LF в Git, PyPI и Docker; проверка --with-ci закоммиченных файлов без установки; настройка docker_cleanup (maximum или keep-cache); doctor --fix теперь показывает preview, а --fix --apply записывает; обработка SIGTERM как PID 1 в контейнере; сборка релизов инструментами, закреплёнными по хешу.')}
          {UPSTREAM.imageVersion !== UPSTREAM.version && t(` The published Docker image is still ${UPSTREAM.imageVersion}.`, ` Опубликованный Docker-образ — по-прежнему ${UPSTREAM.imageVersion}.`)}</p>
        <a className="text-link" href={`${UPSTREAM.repository}/blob/${UPSTREAM.tag}/CHANGELOG.md`} target="_blank" rel="noopener noreferrer">{t('Changelog', 'Что нового')}<Icon name="external" size={13}/></a>
      </div>

      <InstallGuide runner={runner} shell={shell} onRunner={setRunner} onShell={setShell} t={t} language={language}/>
      <Configurator config={config} onChange={setConfig} runner={runner} shell={shell} onRunner={setRunner} onShell={setShell} t={t} language={language}/>
      <MoreCommands runner={runner} shell={shell} target={config.target} t={t}/>
      <Features t={t}/>
      <Reference t={t} language={language}/>
      <Faq t={t}/>
    </main>

    <footer className="site-footer">
      <div className="footer-inner">
        <a className="brand" href="#top"><Logo size={28}/><span>AI-KIT</span></a>
        <p>{t('Commands are generated in your browser. Nothing is sent anywhere.', 'Команды создаются в браузере. Ничего никуда не отправляется.')}</p>
        <ul className="footer-links">
          <li><a href={UPSTREAM.repository} target="_blank" rel="noopener noreferrer">GitHub</a></li>
          <li><a href={UPSTREAM.pypi} target="_blank" rel="noopener noreferrer">PyPI</a></li>
          <li><a href={UPSTREAM.dockerHub} target="_blank" rel="noopener noreferrer">Docker Hub</a></li>
          <li><a href={sourceLink('scripts/install.py')} target="_blank" rel="noopener noreferrer">CLI v{UPSTREAM.version} · {UPSTREAM.commit.slice(0, 7)}</a></li>
          <li><a href={UPSTREAM.docsRepository} target="_blank" rel="noopener noreferrer">{t('Site source', 'Исходники сайта')}</a></li>
        </ul>
      </div>
    </footer>
  </>;
}
