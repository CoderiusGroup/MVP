import { beforeEach, describe, expect, it } from "vitest";

import type { DecisionTree } from "../domain/entities/DecisionTree";
import { useTreeStore } from "./TreeStore";

const sampleTree: DecisionTree = {
  requirementId: "ACM-1",
  requirementName: "Sample",
  rootNode: "n1",
  nodes: [
    { id: "n1", type: "question", text: "Domanda 1?", branches: { yes: "n2", no: "n4" } },
    { id: "n2", type: "question", text: "Domanda 2?", branches: { yes: "n3", no: "n4" } },
    { id: "n3", type: "leaf", outcome: "PASS" },
    { id: "n4", type: "leaf", outcome: "FAIL" },
  ],
};

beforeEach(() => {
  useTreeStore.getState().reset();
});

describe("TreeStore", () => {
  it("sets the current node to the root when a tree is loaded", () => {
    useTreeStore.getState().loadTree(sampleTree);

    expect(useTreeStore.getState().currentNodeId).toBe("n1");
    expect(useTreeStore.getState().history).toEqual([]);
    expect(useTreeStore.getState().cursor).toBe(0);
  });

  it("advances to the yes branch and records the step on a positive answer", () => {
    useTreeStore.getState().loadTree(sampleTree);

    useTreeStore.getState().answer(true);

    expect(useTreeStore.getState().currentNodeId).toBe("n2");
    expect(useTreeStore.getState().history).toEqual([{ nodeId: "n1", answer: "yes" }]);
    expect(useTreeStore.getState().cursor).toBe(1);
  });

  it("advances to the no branch on a negative answer", () => {
    useTreeStore.getState().loadTree(sampleTree);

    useTreeStore.getState().answer(false);

    expect(useTreeStore.getState().currentNodeId).toBe("n4");
  });

  it("does nothing when the current node is a leaf", () => {
    useTreeStore.getState().loadTree(sampleTree);
    useTreeStore.getState().answer(false);

    useTreeStore.getState().answer(true);

    expect(useTreeStore.getState().currentNodeId).toBe("n4");
  });

  describe("goBack / goForward", () => {
    it("goBack moves the cursor back without discarding history", () => {
      useTreeStore.getState().loadTree(sampleTree);
      useTreeStore.getState().answer(true);

      useTreeStore.getState().goBack();

      expect(useTreeStore.getState().currentNodeId).toBe("n1");
      expect(useTreeStore.getState().history).toEqual([{ nodeId: "n1", answer: "yes" }]);
      expect(useTreeStore.getState().cursor).toBe(0);
    });

    it("goForward restores the previously visited node after a goBack", () => {
      useTreeStore.getState().loadTree(sampleTree);
      useTreeStore.getState().answer(true);
      useTreeStore.getState().goBack();

      useTreeStore.getState().goForward();

      expect(useTreeStore.getState().currentNodeId).toBe("n2");
      expect(useTreeStore.getState().cursor).toBe(1);
    });

    it("goBack does nothing at the root", () => {
      useTreeStore.getState().loadTree(sampleTree);

      useTreeStore.getState().goBack();

      expect(useTreeStore.getState().currentNodeId).toBe("n1");
    });

    it("goForward does nothing with no history ahead", () => {
      useTreeStore.getState().loadTree(sampleTree);
      useTreeStore.getState().answer(true);

      useTreeStore.getState().goForward();

      expect(useTreeStore.getState().currentNodeId).toBe("n2");
    });

    it("still works after reaching a leaf (a completed tree stays navigable)", () => {
      useTreeStore.getState().loadTree(sampleTree);
      useTreeStore.getState().answer(false);

      useTreeStore.getState().goBack();

      expect(useTreeStore.getState().currentNodeId).toBe("n1");
    });
  });

  describe("re-answering a past node", () => {
    it("answering the same value again just moves forward through history", () => {
      useTreeStore.getState().loadTree(sampleTree);
      useTreeStore.getState().answer(true);
      useTreeStore.getState().goBack();

      useTreeStore.getState().answer(true);

      expect(useTreeStore.getState().currentNodeId).toBe("n2");
      expect(useTreeStore.getState().history).toEqual([{ nodeId: "n1", answer: "yes" }]);
    });

    it("answering a different value discards every step after it", () => {
      useTreeStore.getState().loadTree(sampleTree);
      useTreeStore.getState().answer(true);
      useTreeStore.getState().answer(true);
      useTreeStore.getState().goBack();
      useTreeStore.getState().goBack();

      useTreeStore.getState().answer(false);

      expect(useTreeStore.getState().history).toEqual([{ nodeId: "n1", answer: "no" }]);
      expect(useTreeStore.getState().currentNodeId).toBe("n4");
    });
  });
});
