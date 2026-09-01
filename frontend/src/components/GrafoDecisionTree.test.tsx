import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DecisionTree } from "../domain/entities/DecisionTree";
import { GrafoDecisionTree } from "./GrafoDecisionTree";

const tree = DecisionTree.create({
  requirementId: "ACM-1",
  requirementName: "Sample",
  rootNode: "n1",
  nodes: [
    { id: "n1", type: "question", text: "Domanda 1?", branches: { yes: "n2", no: "n3" } },
    { id: "n2", type: "leaf", outcome: "PASS" },
    { id: "n3", type: "leaf", outcome: "FAIL" },
  ],
});

describe("GrafoDecisionTree", () => {
  it("disegna un nodo per ogni elemento dell'albero", () => {
    render(<GrafoDecisionTree tree={tree} currentNodeId="n1" path={[]} />);

    expect(screen.getByText("n1")).toBeInTheDocument();
    expect(screen.getByText("n2")).toBeInTheDocument();
    expect(screen.getByText("n3")).toBeInTheDocument();
  });

  it("mostra le etichette Sì/No degli archi", () => {
    render(<GrafoDecisionTree tree={tree} currentNodeId="n1" path={[]} />);

    expect(screen.getByText("Sì")).toBeInTheDocument();
    expect(screen.getByText("No")).toBeInTheDocument();
  });

  it("mostra il testo della domanda e gli esiti dentro i nodi", () => {
    render(<GrafoDecisionTree tree={tree} currentNodeId="n1" path={[]} />);

    expect(screen.getByText("Domanda 1?")).toBeInTheDocument();
    expect(screen.getByText("PASS")).toBeInTheDocument();
    expect(screen.getByText("FAIL")).toBeInTheDocument();
  });

  it("evidenzia il nodo corrente e i nodi del percorso visitato", () => {
    render(
      <GrafoDecisionTree
        tree={tree}
        currentNodeId="n2"
        path={[{ nodeId: "n1", answer: "yes" }]}
      />,
    );

    expect(screen.getByText("n1").closest("g")).toHaveAttribute("data-visited", "true");
    expect(screen.getByText("n2").closest("g")).toHaveAttribute("data-current", "true");
  });
});
