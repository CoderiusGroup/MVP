import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { DecisionTree } from "../domain/entities/DecisionTree";
import { GrafoDecisionTree } from "./GrafoDecisionTree";

const tree: DecisionTree = {
  requirementId: "ACM-1",
  requirementName: "Sample",
  rootNode: "n1",
  nodes: [
    { id: "n1", type: "question", text: "Domanda 1?", branches: { yes: "n2", no: "n3" } },
    { id: "n2", type: "leaf", outcome: "PASS" },
    { id: "n3", type: "leaf", outcome: "FAIL" },
  ],
};

describe("GrafoDecisionTree", () => {
  it("mostra tutti i nodi del grafo", () => {
    render(<GrafoDecisionTree tree={tree} currentNodeId="n1" path={[]} />);

    expect(screen.getByText(/n1 —/)).toBeInTheDocument();
    expect(screen.getByText(/n2 —/)).toBeInTheDocument();
    expect(screen.getByText(/n3 —/)).toBeInTheDocument();
  });

  it("evidenzia il nodo corrente e i nodi visitati del percorso", () => {
    render(
      <GrafoDecisionTree
        tree={tree}
        currentNodeId="n2"
        path={[{ nodeId: "n1", answer: "yes" }]}
      />,
    );

    expect(screen.getByText(/n1 —/).closest("li")).toHaveAttribute("data-visited", "true");
    expect(screen.getByText(/n2 —/).closest("li")).toHaveAttribute("data-current", "true");
  });
});
