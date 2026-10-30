// Pinned AI-KIT release that every generated command, flag and file list is checked against.
export const UPSTREAM = {
  version: '1.4.5',
  released: '2026-10-30',
  tag: 'v1.4.5',
  commit: 'e569b7b9ef81edcc2d5168e08ffd5336fff27186',
  repository: 'https://github.com/tigusigalpa/ai-kit',
  package: 'ai-kit-python',
  pypi: 'https://pypi.org/project/ai-kit-python/',
  image: 'tigusigalpa/ai-kit:1.4.5',
  dockerHub: 'https://hub.docker.com/r/tigusigalpa/ai-kit',
  docsRepository: 'https://github.com/tigusigalpa/ai-kit-docs',
} as const;

export const sourceLink = (path: string) => `${UPSTREAM.repository}/blob/${UPSTREAM.tag}/${path}`;
export const readmeLink = (anchor: string) => `${UPSTREAM.repository}/blob/${UPSTREAM.tag}/README.md#${anchor}`;
