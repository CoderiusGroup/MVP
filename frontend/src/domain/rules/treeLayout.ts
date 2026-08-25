// Layout di un decision tree binario per il rendering a grafo: assegna a ogni nodo
// una colonna (x) e una profondità (riga, y). Le foglie occupano colonne progressive,
// i nodi interni si centrano sui figli. Regola pura, indipendente dai pixel.
import type { DecisionTree } from "../entities/DecisionTree";
import type { Node } from "../entities/Node";
import { nodeById } from "./treeRules";

export interface TreeLayoutNode {
  id: string;
  node: Node;
  col: number;
  depth: number;
}

export interface TreeLayoutEdge {
  from: string;
  to: string;
  answer: "yes" | "no";
}

export interface TreeLayout {
  nodes: TreeLayoutNode[];
  edges: TreeLayoutEdge[];
  cols: number;
  depth: number;
}

export function layoutTree(tree: DecisionTree): TreeLayout {
  const nodes: TreeLayoutNode[] = [];
  const edges: TreeLayoutEdge[] = [];
  const seen = new Set<string>();
  let nextCol = 0;
  let maxDepth = 0;

  function place(id: string, depth: number): number {
    const node = nodeById(tree, id);
    if (!node || seen.has(id)) {
      return nextCol;
    }
    seen.add(id);
    maxDepth = Math.max(maxDepth, depth);

    let col: number;
    if (node.type === "question") {
      const yesCol = place(node.branches.yes, depth + 1);
      const noCol = place(node.branches.no, depth + 1);
      col = (yesCol + noCol) / 2;
      edges.push({ from: id, to: node.branches.yes, answer: "yes" });
      edges.push({ from: id, to: node.branches.no, answer: "no" });
    } else {
      col = nextCol;
      nextCol += 1;
    }

    nodes.push({ id, node, col, depth });
    return col;
  }

  place(tree.rootNode, 0);
  return { nodes, edges, cols: Math.max(nextCol, 1), depth: maxDepth };
}
