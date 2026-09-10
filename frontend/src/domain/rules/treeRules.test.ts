import { describe, expect, it } from "vitest";

import { DecisionTree } from "../entities/DecisionTree";
import { currentOutcome, describePath, resolveNodeId } from "./treeRules";

const tree = DecisionTree.create({
  requirementId: "ACM-1",
  requirementName: "Sample",
  rootNode: "n1",
  nodes: [
    { id: "n1", type: "question", text: "Domanda 1?", branches: { yes: "n2", no: "n4" } },
    { id: "n2", type: "question", text: "Domanda 2?", branches: { yes: "n3", no: "n4" } },
    { id: "n3", type: "leaf", outcome: "PASS" },
    { id: "n4", type: "leaf", outcome: "FAIL" },
  ],
});

describe("treeRules", () => {
  it("resolves the root node for an empty path", () => {
    expect(resolveNodeId(tree, [])).toBe("n1");
  });

  it("follows yes/no branches to resolve the reached node", () => {
    expect(resolveNodeId(tree, [{ nodeId: "n1", answer: "yes" }])).toBe("n2");
    expect(
      resolveNodeId(tree, [
        { nodeId: "n1", answer: "yes" },
        { nodeId: "n2", answer: "yes" },
      ]),
    ).toBe("n3");
  });

  it("returns the outcome only when a leaf is reached", () => {
    expect(currentOutcome(tree, [])).toBeNull();
    expect(currentOutcome(tree, [{ nodeId: "n1", answer: "no" }])).toBe("FAIL");
  });

  it("describePath ricostruisce la sequenza domande→risposte", () => {
    expect(
      describePath(tree, [
        { nodeId: "n1", answer: "yes" },
        { nodeId: "n2", answer: "no" },
      ]),
    ).toEqual([
      { nodeId: "n1", text: "Domanda 1?", answer: "yes" },
      { nodeId: "n2", text: "Domanda 2?", answer: "no" },
    ]);
  });
});
