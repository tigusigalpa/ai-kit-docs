// Pinned AI-KIT release that every generated command, flag and file list is checked against.
// The Docker Hub image can lag behind the release: imageVersion is the latest published image tag.
const IMAGE_VERSION: string = '1.4.5';

export const UPSTREAM = {
  version: '1.4.6',
  released: '2026-10-30',
  tag: 'v1.4.6',
  commit: '763bef0dfe600bac6b2a131d254061abcf0ffb6a',
  repository: 'https://github.com/tigusigalpa/ai-kit',
  package: 'ai-kit-python',
  pypi: 'https://pypi.org/project/ai-kit-python/',
  imageVersion: IMAGE_VERSION,
  image: `tigusigalpa/ai-kit:${IMAGE_VERSION}`,
  dockerHub: 'https://hub.docker.com/r/tigusigalpa/ai-kit',
  docsRepository: 'https://github.com/tigusigalpa/ai-kit-docs',
} as const;

export const sourceLink = (path: string) => `${UPSTREAM.repository}/blob/${UPSTREAM.tag}/${path}`;
export const readmeLink = (anchor: string) => `${UPSTREAM.repository}/blob/${UPSTREAM.tag}/README.md#${anchor}`;
const versionParts = (version: string) => version.split('.').map(Number);
/** Whether the published Docker image is at least `version`, i.e. includes what that release introduced. */
export const imageAtLeast = (version: string) => {
  const image = versionParts(UPSTREAM.imageVersion);
  const wanted = versionParts(version);
  for (let index = 0; index < Math.max(image.length, wanted.length); index++) {
    const difference = (image[index] ?? 0) - (wanted[index] ?? 0);
    if (difference) return difference > 0;
  }
  return true;
};
/** Release that added --docker-cleanup and the doctor --fix preview with --fix --apply. */
export const CLEANUP_AND_FIX_PREVIEW = '1.4.6';
/** A user guide under docs/guide/ of the pinned release. */
export const guideLink = (guide: string, anchor?: string) => sourceLink(`docs/guide/${guide}.md${anchor ? `#${anchor}` : ''}`);
