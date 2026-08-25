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

    expect(screen.getByText("Versione").closest("div")).toHaveTextContent("1.0.0");
    expect(screen.getByText("Applicabile a").closest("div")).toHaveTextContent("security");
    expect(screen.getByLabelText("Legenda esiti")).toBeInTheDocument();
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
      expect(screen.getByText(/ACM-1 — Access control/i)).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: /Export JSON/i }));

    expect(decisionTreeService.exportTree).toHaveBeenCalledWith("ACM-1", "json");
  });
});
