// Pinned AI-KIT release that every generated command, flag and file list is checked against.
// The Docker Hub image can lag behind the release: imageVersion is the latest published image tag.
const IMAGE_VERSION: string = '1.9.0';

export const UPSTREAM = {
  version: '1.9.0',
  released: '2026-11-14',
  tag: 'v1.9.0',
  commit: '4aed8daab9e99100ffdda43a5fd4144070602c7e',
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
/**
 * Whether a Docker image (by default the published one) is at least `version`, i.e. includes what that release
 * introduced. Docker runner commands use it to block or replace what a lagging image would reject.
 */
export const imageAtLeast = (version: string, image: string = UPSTREAM.imageVersion) => {
  const have = versionParts(image);
  const wanted = versionParts(version);
  for (let index = 0; index < Math.max(have.length, wanted.length); index++) {
    const difference = (have[index] ?? 0) - (wanted[index] ?? 0);
    if (difference) return difference > 0;
  }
  return true;
};
/** Release that added --docker-cleanup and the doctor --fix preview with --fix --apply. */
export const CLEANUP_AND_FIX_PREVIEW = '1.4.6';
/** Release that added `aikit flags`. */
export const FLAGS_COMMAND = '1.4.7';
/** Release that added `aikit mcp report` and the --allow-downgrade guard. */
export const MCP_REPORT_AND_DOWNGRADE_GUARD = '1.5.0';
/** Release that added `--agent devin`, `--with-uuid` and `--with-claude-github`. */
export const DEVIN_UUID_CLAUDE_GITHUB = '1.6.0';
/** Release that added `--with-task-workflow` and `aikit task`. */
export const TASK_WORKFLOW = '1.7.0';
/** Release that added `--model-switching-enabled` and `--instruction-profile`. */
export const MODEL_CONTROLS = '1.8.0';
/** Release that added model exceptions, `--protect-model` and `route --current-model/--preserve-model`. */
export const MODEL_EXCEPTIONS = '1.9.0';
/** Release that introduced each installer option (or `--agent` value) an older image would reject. */
export const OPTION_SINCE: Readonly<Record<string, string>> = {
  '--docker-cleanup': CLEANUP_AND_FIX_PREVIEW,
  '--allow-downgrade': MCP_REPORT_AND_DOWNGRADE_GUARD,
  '--with-uuid': DEVIN_UUID_CLAUDE_GITHUB,
  '--with-claude-github': DEVIN_UUID_CLAUDE_GITHUB,
  '--agent devin': DEVIN_UUID_CLAUDE_GITHUB,
  '--with-task-workflow': TASK_WORKFLOW,
  '--model-switching-enabled': MODEL_CONTROLS,
  '--instruction-profile': MODEL_CONTROLS,
  '--model-switching-exceptions': MODEL_EXCEPTIONS,
  '--protect-model': MODEL_EXCEPTIONS,
};
/** A user guide under docs/guide/ of the pinned release. */
export const guideLink = (guide: string, anchor?: string) => sourceLink(`docs/guide/${guide}.md${anchor ? `#${anchor}` : ''}`);
