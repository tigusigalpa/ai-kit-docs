import type { CSSProperties } from 'react';
import { STACKS } from '../data/catalog';
import { readmeLink } from '../data/upstream';
import type { T } from '../i18n';
import { Icon, type IconName } from './Icon';

export function Features({ t }: { t: T }) {
  const cards: { icon: IconName; title: string; body: string; tag?: string }[] = [
    { icon: 'shield', title: t('Guardrails you can trust', 'Ограничения, которым можно верить'), body: t('No commits or pushes without your request, confirmation before destructive commands, secret files off-limits. Unavailable checks are reported as unverified — never as passed.', 'Никаких коммитов и push без вашего запроса, подтверждение перед разрушительными командами, секреты недоступны. Недоступные проверки помечаются как непроверенные, а не пройденные.') },
    { icon: 'lock', title: t('Security workflows', 'Сценарии безопасности'), body: t('Cloudflare’s evidence-based audit method and nine Strix skills for code, web, API and OWASP testing. Pinned by SHA-256 and invoked only explicitly.', 'Методика аудита Cloudflare на доказательствах и девять skills Strix для тестов кода, web, API и OWASP. Закреплены по SHA-256 и вызываются только явно.'), tag: 'opt-in' },
    { icon: 'palette', title: t('Web Design workflow', 'Web Design'), body: t('Annotated references and a brief become one coherent design system, a stack-aware implementation and recorded UI acceptance — with a dedicated Laravel Blade route.', 'Референсы с пометками и бриф превращаются в единую дизайн-систему, реализацию под стек и зафиксированную приёмку UI — с отдельным маршрутом для Laravel Blade.'), tag: 'opt-in' },
    { icon: 'layers', title: t('Kubernetes-ready containers', 'Контейнеры, готовые к Kubernetes'), body: t('New Dockerfiles ship with probes, graceful shutdown, non-root execution and manifests. After every Docker task: zero eligible disposable resources left behind.', 'Новые Dockerfile — с пробами, корректной остановкой, запуском не от root и манифестами. После каждой Docker-задачи не остаётся одноразовых ресурсов.') },
    { icon: 'sparkle', title: t('Shared dialogue context', 'Общий контекст диалогов'), body: t('Import two conversations locally, review conflicting claims and export one reference state for ChatGPT and OpenRouter.', 'Импортируйте два диалога локально, разберите противоречия и экспортируйте единое состояние для ChatGPT и OpenRouter.') },
    { icon: 'box', title: t('Safe installer and upgrades', 'Безопасные установка и обновления'), body: t('Preview first, offline, with backups. Local edits become reviewable candidates instead of being overwritten.', 'Сначала preview, офлайн, с резервными копиями. Локальные правки становятся кандидатами на проверку, а не перезаписываются.') },
  ];
  return <section id="features" className="section features-section" aria-labelledby="features-title">
    <div className="section-head">
      <span className="eyebrow">{t('WHAT YOUR AGENTS GET', 'ЧТО ПОЛУЧАТ ВАШИ АГЕНТЫ')}</span>
      <h2 id="features-title">{t('Context that survives every chat.', 'Контекст, который переживает любой чат.')}</h2>
      <p>{t('AI-KIT preserves facts and decisions, points agents at real checks and records where their authority ends.', 'AI-KIT хранит факты и решения, указывает агентам на реальные проверки и фиксирует границы их полномочий.')}</p>
    </div>
    <div className="bento">
      <article className="bento-card memory-card">
        <span className="feature-icon"><Icon name="memory" size={24}/></span>
        <h3>{t('Project memory', 'Память проекта')}</h3>
        <p>{t('Verified facts, module map, commands and decisions that every new chat reads first. Manifests draft them; bootstrap verifies them.', 'Проверенные факты, карта модулей, команды и решения, которые каждый новый чат читает первыми. Манифесты дают черновик, bootstrap проверяет.')}</p>
        <ul className="memory-files" aria-label={t('Memory files', 'Файлы памяти')}>
          <li><code>PROJECT_CONTEXT.md</code><span>{t('purpose, contracts, module map, commands', 'назначение, контракты, модули, команды')}</span></li>
          <li><code>ai-kit/project.json</code><span>{t('machine-readable module facts', 'факты о модулях в JSON')}</span></li>
          <li><code>docs/DECISIONS.md</code><span>{t('decisions and their reasons', 'решения и их причины')}</span></li>
          <li><code>CHANGELOG.md</code><span>{t('what changed and why', 'что и почему изменилось')}</span></li>
        </ul>
      </article>
      <article className="bento-card routing-card">
        <span className="feature-icon"><Icon name="route" size={24}/></span>
        <h3>{t('Adaptive model routing', 'Адаптивная маршрутизация моделей')}</h3>
        <p>{t('Pay for intelligence only where it matters: each task gets a capability level, role and reasoning effort.', 'Платите за интеллект только там, где он нужен: каждая задача получает уровень, роль и effort.')}</p>
        <ol className="ladder">
          <li style={{ '--w': '28%' } as CSSProperties}><b>0–1</b><span>{t('classification, mechanical edits', 'классификация, механические правки')}</span><em>cheap</em></li>
          <li style={{ '--w': '50%' } as CSSProperties}><b>2</b><span>{t('substantive engineering', 'содержательная разработка')}</span><em>work · medium</em></li>
          <li style={{ '--w': '78%' } as CSSProperties}><b>3–5</b><span>{t('hard debugging, concurrency, sensitive correctness', 'сложная отладка, конкурентность, критичная корректность')}</span><em>work · high–max</em></li>
          <li style={{ '--w': '100%' } as CSSProperties}><b>6</b><span>{t('diagnosed capability shortfall', 'выявленная нехватка возможностей')}</span><em>escalation</em></li>
        </ol>
        <p className="small-print">{t('OpenAI, Anthropic, Kimi, Gemini or local/Ollama models. It recommends; it never fakes a switch.', 'OpenAI, Anthropic, Kimi, Gemini или локальные/Ollama-модели. Только рекомендует и не имитирует переключение.')}</p>
      </article>
      <article className="bento-card stacks-card">
        <span className="feature-icon"><Icon name="layers" size={24}/></span>
        <h3>{t('12 stack profiles', '12 профилей стеков')}</h3>
        <p>{t('Expert rules detected per module: a Laravel app in web/ and a Go service in api/ each get the right guidance.', 'Экспертные правила по модулям: Laravel в web/ и Go-сервис в api/ получают каждый свои правила.')}</p>
        <ul className="stack-chips">{STACKS.map(stack => <li key={stack}>{stack}</li>)}</ul>
      </article>
      <article className="bento-card loop-card">
        <span className="feature-icon"><Icon name="loop" size={24}/></span>
        <h3>{t('Engineering loop', 'Инженерный цикл')}</h3>
        <ol className="loop-steps">{[t('plan', 'план'), t('implement', 'реализация'), t('test', 'тесты'), t('review', 'ревью'), t('document', 'документация')].map(step => <li key={step}>{step}</li>)}</ol>
        <p>{t('Three one-command workflows:', 'Три сценария одной командой:')}</p>
        <ul className="slash-list">
          <li><code>/ai-kit-bootstrap</code><span>{t('fill context from real evidence', 'заполнить контекст по фактам')}</span></li>
          <li><code>/ai-kit-review</code><span>{t('review changes against the rules', 'ревью изменений по правилам')}</span></li>
          <li><code>/ai-kit-sync-context</code><span>{t('sync context, decisions, changelog', 'синхронизировать контекст и changelog')}</span></li>
        </ul>
        <p className="small-print">{t('In Codex use $ai-kit-bootstrap and so on.', 'В Codex — $ai-kit-bootstrap и т. д.')}</p>
      </article>
      {cards.map(card => <article key={card.title} className="bento-card">
        <span className="feature-icon"><Icon name={card.icon} size={24}/></span>
        <h3>{card.title}{card.tag && <span className="pill subtle">{card.tag}</span>}</h3>
        <p>{card.body}</p>
      </article>)}
    </div>
    <p className="section-more"><a className="text-link" href={readmeLink('feature-tour')} target="_blank" rel="noopener noreferrer">{t('Full feature tour in the README', 'Полный обзор возможностей в README')}<Icon name="external" size={13}/></a></p>
  </section>;
}
