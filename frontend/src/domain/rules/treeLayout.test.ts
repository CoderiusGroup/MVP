import { describe, expect, it } from "vitest";

import { DecisionTree } from "../entities/DecisionTree";
import { layoutTree } from "./treeLayout";

const tree = DecisionTree.create({
  requirementId: "ACM-1",
  requirementName: "Sample",
  rootNode: "n1",
  nodes: [
    { id: "n1", type: "question", text: "D1", branches: { yes: "n2", no: "n3" } },
    { id: "n2", type: "leaf", outcome: "PASS" },
    { id: "n3", type: "leaf", outcome: "FAIL" },
  ],
});

const by = (layout: ReturnType<typeof layoutTree>, id: string) =>
  layout.nodes.find((n) => n.id === id)!;

describe("treeLayout", () => {
  it("mette la radice a profondità 0 e le foglie alla riga sotto", () => {
    const l = layoutTree(tree);
    expect(by(l, "n1").depth).toBe(0);
    expect(by(l, "n2").depth).toBe(1);
    expect(by(l, "n3").depth).toBe(1);
    expect(l.depth).toBe(1);
  });

  it("dà colonne distinte alle foglie e centra il nodo genitore", () => {
    const l = layoutTree(tree);
    expect(by(l, "n2").col).toBeLessThan(by(l, "n3").col);
    expect(by(l, "n1").col).toBeGreaterThan(by(l, "n2").col);
    expect(by(l, "n1").col).toBeLessThan(by(l, "n3").col);
    expect(l.cols).toBe(2);
  });

  it("genera due archi Yes/No per ogni nodo domanda", () => {
    const l = layoutTree(tree);
    expect(l.edges).toHaveLength(2);
    expect(l.edges).toContainEqual({ from: "n1", to: "n2", answer: "yes" });
    expect(l.edges).toContainEqual({ from: "n1", to: "n3", answer: "no" });
  });
});
