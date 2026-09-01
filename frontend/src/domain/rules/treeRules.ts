import type { DecisionTree } from "../entities/DecisionTree";
import type { Node, Outcome } from "../entities/Node";
import type { PathStep } from "../entities/Session";

export type { Outcome } from "../entities/Node";

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
    nodeId = node.next(step.answer === "yes");
  }
  return nodeId;
}

export function currentOutcome(tree: DecisionTree, steps: PathStep[]): Outcome | null {
  const node = nodeById(tree, resolveNodeId(tree, steps));
  return node ? node.verdict() : null;
}

export function isRequirementComplete(tree: DecisionTree, steps: PathStep[]): boolean {
  return currentOutcome(tree, steps) !== null;
}

export interface PathQuestion {
  nodeId: string;
  text: string;
  answer: "yes" | "no";
}

// UC-27.1.1.1: sequenza ordinata domande→risposte di un requisito completato.
export function describePath(tree: DecisionTree, steps: PathStep[]): PathQuestion[] {
  return steps.map((step) => {
    const node = nodeById(tree, step.nodeId);
    return {
      nodeId: step.nodeId,
      text: node && node.type === "question" ? node.text : step.nodeId,
      answer: step.answer,
    };
  });
}
