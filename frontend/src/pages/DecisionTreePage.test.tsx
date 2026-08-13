import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useTreeStore } from "../store/TreeStore";
import { DecisionTreePage } from "./DecisionTreePage";

const sampleTreeResponse = {
  requirementId: "ACM-1",
  requirementName: "Sample",
  rootNode: "n1",
  nodes: [
    { id: "n1", type: "question", text: "Domanda 1?", branches: { yes: "n2", no: "n3" } },
    { id: "n2", type: "leaf", outcome: "PASS" },
    { id: "n3", type: "leaf", outcome: "FAIL" },
  ],
};

beforeEach(() => {
  useTreeStore.getState().reset();
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(sampleTreeResponse),
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("DecisionTreePage", () => {
  it("shows the code and text of the current node (UC-22.1)", async () => {
    render(<DecisionTreePage treeId="ACM-1" />);

    await waitFor(() => expect(screen.getByText("n1")).toBeInTheDocument());
    expect(screen.getByText("Domanda 1?")).toBeInTheDocument();
  });

  it("renders the full graph and highlights the current node and visited path (UC-22.2)", async () => {
    render(<DecisionTreePage treeId="ACM-1" />);

    await waitFor(() => expect(screen.getByRole("button", { name: "Sì" })).toBeInTheDocument());

    expect(screen.getByText(/n1 —/)).toBeInTheDocument();
    expect(screen.getByText(/n2 —/)).toBeInTheDocument();
    expect(screen.getByText(/n3 —/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Sì" }));

    await waitFor(() => expect(useTreeStore.getState().currentNodeId).toBe("n2"));
    expect(useTreeStore.getState().history).toEqual([{ nodeId: "n1", answer: "yes" }]);
  });

  it("lets the user go back without losing the answer, and forward to restore it", async () => {
    render(<DecisionTreePage treeId="ACM-1" />);
    await waitFor(() => expect(screen.getByRole("button", { name: "Sì" })).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Sì" }));
    await waitFor(() => expect(useTreeStore.getState().currentNodeId).toBe("n2"));

    fireEvent.click(screen.getByRole("button", { name: "Indietro" }));

    expect(useTreeStore.getState().currentNodeId).toBe("n1");
    expect(useTreeStore.getState().history).toEqual([{ nodeId: "n1", answer: "yes" }]);
    expect(screen.getByText("Risposta data in precedenza: Sì")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Avanti" }));

    expect(useTreeStore.getState().currentNodeId).toBe("n2");
  });

  it("discards the future when a past answer is changed to a different value", async () => {
    render(<DecisionTreePage treeId="ACM-1" />);
    await waitFor(() => expect(screen.getByRole("button", { name: "Sì" })).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Sì" }));
    await waitFor(() => expect(useTreeStore.getState().currentNodeId).toBe("n2"));
    fireEvent.click(screen.getByRole("button", { name: "Indietro" }));

    fireEvent.click(screen.getByRole("button", { name: "No" }));

    expect(useTreeStore.getState().history).toEqual([{ nodeId: "n1", answer: "no" }]);
    expect(useTreeStore.getState().currentNodeId).toBe("n3");
  });
});
