import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DecisionTree } from "../domain/entities/DecisionTree";
import { layoutTree } from "../domain/rules/treeLayout";
import { GrafoDecisionTree, toFlow } from "./GrafoDecisionTree";

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

const flowOf = (opts: Parameters<typeof toFlow>[1]) => toFlow(layoutTree(tree), opts);

describe("toFlow", () => {
  it("mappa ogni nodo del layout in un nodo React Flow con posizione", () => {
    const { nodes } = flowOf({});

    expect(nodes.map((n) => n.id).sort()).toEqual(["n1", "n2", "n3"]);
    for (const node of nodes) {
      expect(node.type).toBe("treeNode");
      expect(typeof node.position.x).toBe("number");
      expect(typeof node.position.y).toBe("number");
    }
  });

  it("porta testo della domanda ed esito delle foglie nei dati del nodo", () => {
    const { nodes } = flowOf({});
    const byId = (id: string) => nodes.find((n) => n.id === id)!.data;

    expect(byId("n1").text).toBe("Domanda 1?");
    expect(byId("n2")).toMatchObject({ isLeaf: true, outcome: "PASS" });
    expect(byId("n3")).toMatchObject({ isLeaf: true, outcome: "FAIL" });
  });

  it("genera archi con etichetta Sì/No", () => {
    const { edges } = flowOf({});

    expect(edges).toHaveLength(2);
    expect(edges.map((e) => e.label).sort()).toEqual(["No", "Sì"]);
  });

  it("evidenzia il nodo corrente e i nodi del percorso visitato", () => {
    const { nodes } = flowOf({ currentNodeId: "n2", path: [{ nodeId: "n1", answer: "yes" }] });
    const byId = (id: string) => nodes.find((n) => n.id === id)!.data;

    expect(byId("n1").isVisited).toBe(true);
    expect(byId("n2").isCurrent).toBe(true);
    expect(byId("n3").isDimmed).toBe(true);
  });

  it("evidenzia l'arco del ramo percorso", () => {
    const { edges } = flowOf({ path: [{ nodeId: "n1", answer: "yes" }] });
    const yes = edges.find((e) => e.id === "n1-yes")!;
    const no = edges.find((e) => e.id === "n1-no")!;

    expect(yes.style?.stroke).not.toBe(no.style?.stroke);
    expect(yes.style?.strokeWidth).toBeGreaterThan(no.style?.strokeWidth as number);
  });

  it("in modalità readOnly nessun nodo è corrente o attenuato", () => {
    const { nodes } = flowOf({ currentNodeId: "n1", readOnly: true });

    expect(nodes.every((n) => n.data.isCurrent === false)).toBe(true);
    expect(nodes.every((n) => n.data.isDimmed === false)).toBe(true);
  });
});

describe("GrafoDecisionTree", () => {
  it("monta il grafo e mostra il contenuto dei nodi", () => {
    render(<GrafoDecisionTree tree={tree} currentNodeId="n1" path={[]} />);

    expect(screen.getByLabelText("Grafo decision tree")).toBeInTheDocument();
    expect(screen.getByText("n1")).toBeInTheDocument();
    expect(screen.getByText("Domanda 1?")).toBeInTheDocument();
    expect(screen.getByText("PASS")).toBeInTheDocument();
  });
});
