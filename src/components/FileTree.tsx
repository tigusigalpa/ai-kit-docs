import { buildTree, type TreeNode } from '../domain/footprint';
import type { T } from '../i18n';
import { Icon } from './Icon';

function describe(path: string, t: T): string | undefined {
  const notes: Record<string, string> = {
    'AGENTS.md': t('starting instructions', 'стартовые инструкции'),
    'PROJECT_CONTEXT.md': t('verified project facts', 'проверенные факты проекта'),
    'WIKI.md': t('documentation map', 'карта документации'),
    'CHANGELOG.md': t('what changed and why', 'что и почему изменилось'),
    'CLAUDE.md': t('imports AGENTS.md', 'импортирует AGENTS.md'),
    'ai-kit/settings.json': t('your choices', 'ваш выбор'),
    'ai-kit/CORE.md': t('language, Git authority, facts', 'язык, полномочия Git, факты'),
    'docs/DECISIONS.md': t('decision log', 'журнал решений'),
    '.gitignore': t('one managed block', 'один управляемый блок'),
  };
  return notes[path];
}

function Node({ node, depth, t }: { node: TreeNode; depth: number; t: T }) {
  if (!node.children.length) {
    const note = describe(node.path, t);
    return <li className="tree-file"><Icon name="file" size={14}/><span>{node.name}</span>{note && <em>{note}</em>}</li>;
  }
  return <li className="tree-folder">
    <details open={depth === 0 && node.files <= 24}>
      <summary><Icon name="chevron" size={13} className="tree-chevron"/><Icon name="folder" size={14}/><span>{node.name}/</span><b>{node.files}</b></summary>
      <ul>{node.children.map(child => <Node key={child.path} node={child} depth={depth + 1} t={t}/>)}</ul>
    </details>
  </li>;
}

export function FileTree({ files, t }: { files: string[]; t: T }) {
  const tree = buildTree(files);
  return <div className="file-tree" aria-label={t('Files written by the preview', 'Файлы, которые покажет preview')}>
    <div className="tree-head"><span>{t('your-project/', 'ваш-проект/')}</span><b>{files.length} {t('files', 'файлов')}</b></div>
    <ul>{tree.children.map(child => <Node key={child.path} node={child} depth={0} t={t}/>)}</ul>
  </div>;
}
