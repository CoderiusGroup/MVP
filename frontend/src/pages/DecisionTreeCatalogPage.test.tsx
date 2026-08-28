import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BrowserRouter } from "react-router-dom";

import { DecisionTreeCatalogPage } from "./DecisionTreeCatalogPage";
import { decisionTreeService } from "../services/DecisionTreeService";

vi.mock("../services/DecisionTreeService", () => ({
  decisionTreeService: {
    listTrees: vi.fn(),
    getTree: vi.fn(),
    importTree: vi.fn(),
    exportTree: vi.fn(),
  },
}));

describe("DecisionTreeCatalogPage", () => {
  it("mostra la lista dei requisiti e il dettaglio del primo tree", async () => {
    vi.mocked(decisionTreeService.listTrees).mockResolvedValue([
      { requirementId: "ACM-1", requirementName: "Access control" },
      { requirementId: "AUM-2", requirementName: "Authentication" },
    ]);
    vi.mocked(decisionTreeService.getTree).mockResolvedValue({
      requirementId: "ACM-1",
      requirementName: "Access control",
      rootNode: "N1",
      version: "1.0.0",
      appliesTo: ["security"],
      dependencies: [],
      nodes: [
        { id: "N1", type: "question", text: "Question 1?", branches: { yes: "L1", no: "L2" } },
        { id: "L1", type: "leaf", outcome: "PASS", text: "Ok" },
        { id: "L2", type: "leaf", outcome: "FAIL", text: "No" },
      ],
    });

    render(
      <BrowserRouter>
        <DecisionTreeCatalogPage />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Decision Tree disponibili/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/ACM-1 — Access control/i)).toBeInTheDocument();
    expect(screen.getByText(/AUM-2 — Authentication/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Grafo decision tree/i)).toBeInTheDocument();
    });

    expect(screen.getByText("Versione:").closest("div")).toHaveTextContent("1.0.0");
    expect(screen.getByText("Applicabile a:").closest("div")).toHaveTextContent("security");
    expect(screen.getAllByText(/Question 1\?/i).length).toBeGreaterThan(0);
  });

  it("esporta il tree JSON quando clicco il bottone appropriato", async () => {
    vi.mocked(decisionTreeService.listTrees).mockResolvedValue([
      { requirementId: "ACM-1", requirementName: "Access control" },
    ]);
    vi.mocked(decisionTreeService.getTree).mockResolvedValue({
      requirementId: "ACM-1",
      requirementName: "Access control",
      rootNode: "N1",
      nodes: [
        { id: "N1", type: "question", text: "Question 1?", branches: { yes: "L1", no: "L2" } },
        { id: "L1", type: "leaf", outcome: "PASS", text: "Ok" },
        { id: "L2", type: "leaf", outcome: "FAIL", text: "No" },
      ],
    });
    vi.mocked(decisionTreeService.exportTree).mockResolvedValue();

    render(
      <BrowserRouter>
        <DecisionTreeCatalogPage />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Export JSON/i })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: /Export JSON/i }));

    expect(decisionTreeService.exportTree).toHaveBeenCalledWith("ACM-1", "json");
  });

  it("importa un decision tree e aggiorna il catalogo", async () => {
    const importedTree = {
      requirementId: "TST-1",
      requirementName: "Imported tree",
      rootNode: "N1",
      nodes: [
        { id: "N1", type: "question" as const, text: "Question?", branches: { yes: "L1", no: "L2" } },
        { id: "L1", type: "leaf" as const, outcome: "PASS" as const },
        { id: "L2", type: "leaf" as const, outcome: "FAIL" as const },
      ],
    };
    vi.mocked(decisionTreeService.listTrees)
      .mockResolvedValueOnce([{ requirementId: "ACM-1", requirementName: "Access control" }])
      .mockResolvedValueOnce([{ requirementId: "ACM-1", requirementName: "Access control" }, importedTree]);
    vi.mocked(decisionTreeService.getTree).mockResolvedValue(importedTree);
    vi.mocked(decisionTreeService.importTree).mockResolvedValue(importedTree);

    render(
      <BrowserRouter>
        <DecisionTreeCatalogPage />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Importa decision tree/i })).toBeInTheDocument();
    });

    const file = new File([JSON.stringify(importedTree)], "tree.json", { type: "application/json" });
    await userEvent.upload(screen.getByLabelText("Seleziona decision tree da importare"), file);

    await waitFor(() => {
      expect(decisionTreeService.importTree).toHaveBeenCalledWith(file);
      expect(screen.getAllByText(/TST-1 — Imported tree/i)).toHaveLength(2);
      expect(screen.getByText("Question?")).toBeInTheDocument();
    });
  });
});
