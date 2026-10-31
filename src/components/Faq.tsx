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
    [t('The installer refuses to downgrade my project.', 'Установщик отказывается откатывать мой проект.'),
      t('Since 1.5.0, when the project records a newer AI-KIT than your CLI, the preview warns and apply (also doctor --fix --apply) refuses, so older files cannot replace newer ones. Upgrade the CLI and run the update again. Pass --allow-downgrade only when you deliberately want the older version.', 'Начиная с 1.5.0, если в проекте записана более новая версия AI-KIT, чем у вашего CLI, preview предупреждает, а apply (и doctor --fix --apply) отказывается, чтобы старые файлы не заменили новые. Обновите CLI и повторите обновление. --allow-downgrade нужен, только если вы намеренно возвращаетесь к старой версии.')],
    [t('Does AI-KIT connect MCP servers?', 'AI-KIT подключает MCP-серверы?'),
      t('No. Installing never registers, starts or authorizes a server. aikit mcp report lists the servers already configured in the project’s client files and warns about literal credentials, plain remote HTTP and auto-approval, without printing secret values or contacting any server.', 'Нет. Установка не регистрирует, не запускает и не авторизует серверы. aikit mcp report показывает серверы, уже настроенные в файлах клиентов проекта, и предупреждает о секретах прямо в файлах, обычном HTTP к удалённым хостам и автоподтверждении, не выводя значений секретов и не обращаясь к серверам.')],
    [t('Why does my agent reply in English now?', 'Почему агент теперь отвечает на английском?'),
      t('Since 1.6.0 new and interactive installations default to English chat. A project you update keeps its saved language, including Russian. Pass --chat-language Russian or English to change it; authored project files are always English.', 'С версии 1.6.0 новые и интерактивные установки по умолчанию ведут чат на английском. Обновляемый проект сохраняет свой язык, в том числе Russian. Чтобы сменить его, укажите --chat-language Russian или English; файлы проекта всегда на английском.')],
    [t('How do I move from Windsurf to Devin?', 'Как перейти с Windsurf на Devin?'),
      t('Select both devin and windsurf in the full client list once, then preview and apply. Next preview aikit adapters retire . --agent windsurf and repeat it with --apply: unchanged legacy rules are removed and windsurf is deselected, while edited rules are preserved for review. Devin reads both rule folders, so check for duplicates meanwhile.', 'Один раз выберите devin и windsurf в полном списке клиентов, затем preview и apply. После этого выполните preview aikit adapters retire . --agent windsurf и повторите с --apply: неизменённые старые правила удалятся, windsurf будет снят с выбора, а изменённые правила сохранятся для проверки. Devin читает обе папки правил, поэтому пока проверьте дубли.')],
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
