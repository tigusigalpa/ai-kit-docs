import type { Text } from './data/catalog';
import type { Issue } from './domain/config';

export type Language = 'en' | 'ru';
export type T = (english: string, russian: string) => string;

export const translator = (language: Language): T => (english, russian) => language === 'ru' ? russian : english;
export const pick = (language: Language, text: Text) => language === 'ru' ? text[1] : text[0];

const ISSUES: Record<string, Text> = {
  'target-empty': ['Enter the application folder; use . for the current directory.', 'Укажите папку приложения; . — текущая папка.'],
  control: ['Remove control characters from the path.', 'Уберите управляющие символы из пути.'],
  'source-target': ['A source checkout runs from the AI-KIT folder, so the target must be an absolute path to your application outside it. Installing inside the reference distribution is refused.', 'Из исходников команды запускаются в папке AI-KIT, поэтому нужен абсолютный путь к приложению вне её. Установка внутрь дистрибутива запрещена.'],
  'powershell-tilde': ['PowerShell does not expand ~ for native programs. Use a full path such as C:\\Users\\you\\Projects\\my-app or . from the project folder.', 'PowerShell не раскрывает ~ для внешних программ. Укажите полный путь вроде C:\\Users\\you\\Projects\\my-app или . из папки проекта.'],
  'windows-path-posix': ['This looks like a Windows path while Bash is selected. Switch the shell to PowerShell or use a POSIX path.', 'Это похоже на путь Windows, а выбран Bash. Переключите оболочку на PowerShell или укажите POSIX-путь.'],
  'posix-path-powershell': ['This looks like a POSIX path while PowerShell is selected. Check the shell choice.', 'Это похоже на POSIX-путь, а выбран PowerShell. Проверьте выбор оболочки.'],
  'docker-home': ['Mount a specific application folder rather than your whole home directory.', 'Монтируйте конкретную папку приложения, а не весь домашний каталог.'],
  'chat-language': ['Chat language must be a non-empty name up to 60 characters without control characters, not starting with a dash.', 'Язык чата — непустое название до 60 символов без управляющих символов и не начинающееся с дефиса.'],
  'accept-local': ['Each reviewed path must be relative to the project, without .. or a leading dash.', 'Каждый путь — относительно проекта, без .. и без дефиса в начале.'],
  'accept-settings': ['ai-kit/settings.json is project-owned and cannot be accepted with --accept-local.', 'ai-kit/settings.json принадлежит проекту и не принимается через --accept-local.'],
  'powershell-quote': ['Remove double quotes: Windows PowerShell does not pass them reliably to native programs.', 'Уберите двойные кавычки: Windows PowerShell ненадёжно передаёт их внешним программам.'],
  'accept-fresh': ['--accept-local is meant for reviewed merges of an existing installation, after a preview reported conflicts.', '--accept-local нужен для проверенного слияния в существующей установке, после того как preview показал конфликты.'],
  'needs-claude': ['Native wiring for these extras needs Claude Code selected:', 'Для родного подключения этих extras нужен выбранный Claude Code:'],
  'native-settings-clients': ['Native settings write Claude permissions and Cursor/Gemini/Aider ignore files; none of those clients is selected.', 'Native settings пишут права Claude и ignore-файлы Cursor/Gemini/Aider; ни один из этих клиентов не выбран.'],
  'scoped-rules-clients': ['Scoped rules need a client with a scoped format: Claude, Cursor, Copilot, Windsurf or Cline.', 'Правилам по модулям нужен клиент с таким форматом: Claude, Cursor, Copilot, Windsurf или Cline.'],
  'needs-codex': ['Orchestration installs native helpers only for Codex. Select Codex to receive them.', 'Оркестрация ставит родных помощников только для Codex. Выберите Codex, чтобы их получить.'],
  'agents-replace': ['An explicit --agent list replaces the saved selection; it is not added to it. Leave clients empty to keep the saved ones.', 'Явный список --agent заменяет сохранённый выбор, а не дополняет его. Оставьте клиентов пустыми, чтобы сохранить текущих.'],
  'preset-disables': ['This preset turns these previously enabled extras off unless you select them explicitly:', 'Пресет выключит эти ранее включённые extras, если не выбрать их явно:'],
  'mode-overrides-preset': ['Your explicit sharing mode takes precedence over the preset mode.', 'Явно выбранный режим доступа важнее режима пресета.'],
  'ci-private': ['The CI workflow is intended for team mode: private mode excludes the installer state it checks from Git.', 'CI workflow рассчитан на режим team: в private состояние установщика, которое он проверяет, исключено из Git.'],
  'docker-interactive': ['The interactive wizard needs a terminal, so the Docker command includes -it.', 'Интерактивному мастеру нужен терминал, поэтому в Docker-команду добавлен -it.'],
};

export const issueText = (issue: Issue, language: Language) => {
  const text = ISSUES[issue.code];
  const message = text ? pick(language, text) : issue.code;
  return issue.detail && (issue.code === 'needs-claude' || issue.code === 'preset-disables') ? `${message} ${issue.detail}` : message;
};
