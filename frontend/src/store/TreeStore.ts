import { create } from "zustand";

import type { DecisionTree } from "../domain/entities/DecisionTree";
import type { PathStep } from "../domain/entities/Session";
import { resolveNodeId } from "../domain/rules/treeRules";

interface TreeState {
  tree: DecisionTree | null;
  currentNodeId: string | null;
  history: PathStep[];
  cursor: number;
  loadTree: (tree: DecisionTree) => void;
  hydrate: (tree: DecisionTree, steps: PathStep[]) => void;
  answer: (value: boolean) => void;
  goBack: () => void;
  goForward: () => void;
  reset: () => void;
}

const resolveCurrentNodeId = resolveNodeId;

export const useTreeStore = create<TreeState>((set, get) => ({
  tree: null,
  currentNodeId: null,
  history: [],
  cursor: 0,

  loadTree: (tree) => {
    set({ tree, currentNodeId: tree.rootNode, history: [], cursor: 0 });
  },

  hydrate: (tree, steps) => {
    set({
      tree,
      history: steps,
      cursor: steps.length,
      currentNodeId: resolveCurrentNodeId(tree, steps),
    });
  },

  answer: (value) => {
    const { tree, currentNodeId, history, cursor } = get();
    if (!tree || !currentNodeId) {
      return;
    }

    const currentNode = tree.nodes.find((node) => node.id === currentNodeId);
    if (!currentNode || currentNode.type !== "question") {
      return;
    }

    const newAnswer = value ? "yes" : "no";
    const existingStep = history[cursor];

    if (existingStep && existingStep.nodeId === currentNodeId && existingStep.answer === newAnswer) {
      const nextCursor = cursor + 1;
      set({ cursor: nextCursor, currentNodeId: resolveCurrentNodeId(tree, history.slice(0, nextCursor)) });
      return;
    }

    const newHistory = [...history.slice(0, cursor), { nodeId: currentNodeId, answer: newAnswer as "yes" | "no" }];
    set({
      history: newHistory,
      cursor: newHistory.length,
      currentNodeId: resolveCurrentNodeId(tree, newHistory),
    });
  },

  goBack: () => {
    const { tree, history, cursor } = get();
    if (!tree || cursor === 0) {
      return;
    }

    const nextCursor = cursor - 1;
    set({ cursor: nextCursor, currentNodeId: resolveCurrentNodeId(tree, history.slice(0, nextCursor)) });
  },

  goForward: () => {
    const { tree, history, cursor } = get();
    if (!tree || cursor >= history.length) {
      return;
    }

    const nextCursor = cursor + 1;
    set({ cursor: nextCursor, currentNodeId: resolveCurrentNodeId(tree, history.slice(0, nextCursor)) });
  },

  reset: () => {
    set({ tree: null, currentNodeId: null, history: [], cursor: 0 });
  },
}));
