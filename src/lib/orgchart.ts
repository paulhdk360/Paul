import type { Employe } from "@/lib/types";

export interface OrgNode {
  employe: Employe;
  children: OrgNode[];
  depth: number;
  // x is in "unit" slots (leaves get 1 unit each, parents centered over
  // their children) — the renderer decides the pixel/mm width per unit.
  x: number;
  width: number;
}

// A manager pointing at an inactive employee, or at itself/a cycle (bad
// data entry), would otherwise silently vanish or infinite-loop — treat
// anything that doesn't resolve to a real active manager as a root instead.
export function buildOrgTree(employes: Employe[]): OrgNode[] {
  const byId = new Map(employes.map((e) => [e.id, e]));
  const childrenOf = new Map<string, Employe[]>();
  const roots: Employe[] = [];

  for (const e of employes) {
    const managerOk = e.manager_id && byId.has(e.manager_id) && e.manager_id !== e.id;
    if (managerOk) {
      const arr = childrenOf.get(e.manager_id!) ?? [];
      arr.push(e);
      childrenOf.set(e.manager_id!, arr);
    } else {
      roots.push(e);
    }
  }

  const visiting = new Set<string>();
  function build(e: Employe, depth: number): OrgNode {
    // Cycle guard (A manages B manages A) — break the cycle by stopping
    // descent rather than recursing forever.
    if (visiting.has(e.id)) return { employe: e, children: [], depth, x: 0, width: 1 };
    visiting.add(e.id);
    const kids = (childrenOf.get(e.id) ?? [])
      .sort((a, b) => a.nom.localeCompare(b.nom))
      .map((c) => build(c, depth + 1));
    visiting.delete(e.id);
    const width = kids.length ? kids.reduce((s, k) => s + k.width, 0) : 1;
    return { employe: e, children: kids, depth, x: 0, width };
  }

  const tree = roots.sort((a, b) => a.nom.localeCompare(b.nom)).map((r) => build(r, 0));
  assignX(tree, 0);
  return tree;
}

function assignX(nodes: OrgNode[], startX: number): number {
  let cursor = startX;
  for (const n of nodes) {
    if (n.children.length === 0) {
      n.x = cursor + 0.5;
      cursor += 1;
    } else {
      const childStart = cursor;
      cursor = assignX(n.children, childStart);
      n.x = (n.children[0].x + n.children[n.children.length - 1].x) / 2;
    }
  }
  return cursor;
}

export function flattenOrgTree(nodes: OrgNode[]): OrgNode[] {
  return nodes.flatMap((n) => [n, ...flattenOrgTree(n.children)]);
}

export function orgTreeMaxDepth(nodes: OrgNode[]): number {
  const flat = flattenOrgTree(nodes);
  return flat.reduce((max, n) => Math.max(max, n.depth), 0);
}

export function orgTreeTotalWidth(nodes: OrgNode[]): number {
  return nodes.reduce((sum, n) => sum + n.width, 0);
}
