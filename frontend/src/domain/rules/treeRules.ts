import type { DecisionTree } from "../entities/DecisionTree";
import type { Node } from "../entities/Node";
import type { PathStep } from "../entities/Session";

export type Outcome = "PASS" | "FAIL" | "NOT_APPLICABLE";

export function nodeById(tree: DecisionTree, id: string): Node | undefined {
  return tree.nodes.find((node) => node.id === id);
}

export function resolveNodeId(tree: DecisionTree, steps: PathStep[]): string {
  let nodeId = tree.rootNode;
  for (const step of steps) {
    const node = nodeById(tree, nodeId);
    if (!node || node.type !== "question") {
      break;
    }
    nodeId = step.answer === "yes" ? node.branches.yes : node.branches.no;
  }
  return nodeId;
}

export function currentOutcome(tree: DecisionTree, steps: PathStep[]): Outcome | null {
  const node = nodeById(tree, resolveNodeId(tree, steps));
  return node && node.type === "leaf" ? node.outcome : null;
}

export function isRequirementComplete(tree: DecisionTree, steps: PathStep[]): boolean {
  return currentOutcome(tree, steps) !== null;
}
