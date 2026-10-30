import model from '../data/footprint.json';
import type { Agent, Extra, Mode } from '../data/catalog';

interface ModeModel {
  base: string[];
  agents: Record<string, string[]>;
  extras: Record<string, { common: string[]; byAgent: Record<string, string[]> }>;
}
const modes = model.modes as Record<Mode, ModeModel>;

/** Files a preview lists for an empty folder, derived from pinned installer previews (scripts/footprint.py). */
export function footprint(agents: readonly Agent[], extras: readonly Extra[], mode: Mode): string[] {
  const data = modes[mode];
  const files = new Set(data.base);
  for (const agent of agents) data.agents[agent]?.forEach(file => files.add(file));
  for (const extra of extras) {
    const entry = data.extras[extra];
    entry?.common.forEach(file => files.add(file));
    for (const agent of agents) entry?.byAgent[agent]?.forEach(file => files.add(file));
  }
  return [...files].sort();
}

export interface TreeNode { name: string; path: string; children: TreeNode[]; files: number }

export function buildTree(paths: readonly string[]): TreeNode {
  const root: TreeNode = { name: '', path: '', children: [], files: 0 };
  for (const path of paths) {
    let node = root;
    node.files += 1;
    path.split('/').forEach((part, index, parts) => {
      let child = node.children.find(item => item.name === part);
      if (!child) {
        child = { name: part, path: parts.slice(0, index + 1).join('/'), children: [], files: 0 };
        node.children.push(child);
      }
      if (index < parts.length - 1) child.files += 1;
      node = child;
    });
  }
  const order = (node: TreeNode) => {
    node.children.sort((a, b) => Number(b.children.length > 0) - Number(a.children.length > 0) || a.name.localeCompare(b.name));
    node.children.forEach(order);
  };
  order(root);
  return root;
}

export const footprintVersion = model.version;
