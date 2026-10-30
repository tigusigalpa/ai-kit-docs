import { UPSTREAM } from '../data/upstream';
import type { T } from '../i18n';
import { Icon } from './Icon';

export function Faq({ t }: { t: T }) {
  const items: [string, string][] = [
    [t('Does this website install anything or send my settings?', 'Этот сайт что-то устанавливает или отправляет мои настройки?'),
      t('No. It is a static page: commands are built in your browser, with no backend, analytics or remote fonts. A share link carries your choices only in its own URL.', 'Нет. Это статическая страница: команды собираются в браузере, без бэкенда, аналитики и внешних шрифтов. Ссылка «поделиться» хранит выбор только в самом URL.')],
    [t('What does the preview actually do?', 'Что именно делает preview?'),
      t('It prints a JSON plan — writes, preserved files, conflicts, detected stacks and clients, extras and warnings — and writes nothing. Run the same command with --apply when the plan looks right.', 'Печатает JSON-план — writes, сохраняемые файлы, конфликты, найденные стеки и клиенты, extras и предупреждения — и ничего не пишет. Когда план устраивает, выполните ту же команду с --apply.')],
    [t('Will it overwrite my AGENTS.md, README or context?', 'Перезапишет ли он мои AGENTS.md, README или контекст?'),
      t('No. Existing project documents and context are never overwritten. Customized managed instructions become candidates under ai-kit/.upstream-cache/candidates/ for review, and changed files are backed up first.', 'Нет. Существующие документы и контекст проекта не перезаписываются. Изменённые управляемые инструкции становятся кандидатами в ai-kit/.upstream-cache/candidates/, а изменённые файлы сначала копируются в бэкап.')],
    [t('Private or team mode?', 'Режим private или team?'),
      t('private keeps AI-KIT files and client configuration out of Git through one managed .gitignore block — good for personal use. team keeps shared instructions visible so teammates get them from a fresh clone. Neither mode commits or pushes anything.', 'private убирает файлы AI-KIT и конфигурацию клиентов из Git через один управляемый блок .gitignore — для личной работы. team оставляет общие инструкции видимыми, чтобы команда получала их из свежего клона. Ни один режим ничего не коммитит и не пушит.')],
    [t('How do I turn a module off later?', 'Как потом выключить модуль?'),
      t('Omitting a --with-* flag on update keeps the module, and there are no --without-* flags. Set its key in ai-kit/settings.json to false, then preview again. Already installed files are not removed automatically.', 'Если не указать --with-* при обновлении, модуль остаётся, а флагов --without-* нет. Поставьте его ключ в ai-kit/settings.json в false и снова запустите preview. Установленные файлы автоматически не удаляются.')],
    [t('Windows says “aikit is not recognized”.', 'Windows пишет «aikit не распознан».'),
      t('The package is installed but the Scripts folder is not on this terminal’s PATH. Use python -m aikit.aikit_cli, refresh PATH in the current window, or use the isolated venv with an explicit executable path.', 'Пакет установлен, но папки Scripts нет в PATH этого терминала. Используйте python -m aikit.aikit_cli, обновите PATH в текущем окне или изолированный venv с явным путём к exe.')],
    [t('Docker or pip?', 'Docker или pip?'),
      t('Both run the same installer. Docker needs no host Python and runs offline with a read-only mount for the preview; pip/pipx gives you a native aikit command. Framework toolchains, MCP connections and the Strix executable are separate either way.', 'Оба запускают один и тот же установщик. Docker не требует Python на хосте и работает офлайн с монтированием только для чтения на preview; pip/pipx даёт родную команду aikit. Тулчейны фреймворков, MCP и Strix — отдельно в обоих случаях.')],
    [t('Does installing make my client use the skills?', 'Установка заставит клиента использовать skills?'),
      t('Installing files and client activation are separate steps. Open the project in your client, check that it sees the skills, then run /ai-kit-bootstrap or $ai-kit-bootstrap.', 'Установка файлов и активация в клиенте — разные шаги. Откройте проект в клиенте, убедитесь, что он видит skills, затем запустите /ai-kit-bootstrap или $ai-kit-bootstrap.')],
  ];
  return <section id="faq" className="section faq-section" aria-labelledby="faq-title">
    <div className="faq-intro">
      <span className="eyebrow">{t('GOOD TO KNOW', 'ПОЛЕЗНО ЗНАТЬ')}</span>
      <h2 id="faq-title">{t('Honest answers.', 'Честные ответы.')}</h2>
      <p>{t('Routing recommends controls, permission rules reduce risk without being a security boundary, and every unavailable check stays unverified.', 'Маршрутизация лишь рекомендует, правила доступа снижают риск, но не являются границей безопасности, а недоступные проверки остаются непроверенными.')}</p>
      <a className="text-link" href={UPSTREAM.repository} target="_blank" rel="noopener noreferrer">{t('Read the AI-KIT README', 'README AI-KIT')}<Icon name="external" size={13}/></a>
    </div>
    <div className="faq-list">{items.map(([question, answer]) => <details key={question}>
      <summary>{question}<span className="faq-plus" aria-hidden="true"/></summary><p>{answer}</p>
    </details>)}</div>
  </section>;
}
