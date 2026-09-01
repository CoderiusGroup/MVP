import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

import { Session } from "../domain/entities/Session";
import { queryClient } from "../infrastructure/queryClient";
import { useSessionStore } from "../store/SessionStore";
import { ResultPage } from "./ResultPage";

const tree = {
  requirementId: "ACM-1",
  requirementName: "Sample",
  rootNode: "n1",
  nodes: [
    { id: "n1", type: "question", text: "Domanda 1?", branches: { yes: "n2", no: "n3" } },
    { id: "n2", type: "leaf", outcome: "PASS" },
    { id: "n3", type: "leaf", outcome: "FAIL" },
  ],
};

function completedSession(): Session {
  return Session.parse({
    id: "SES-1",
    savedAt: "2026-08-19T10:00:00Z",
    status: "completed",
    device: {
      id: "DEV-1",
      name: "D",
      operatingSystem: "OS",
      description: "d",
      assets: [
        {
          id: "AS-1",
          name: "Asset 1",
          type: "network",
          description: "d",
          sensitive: false,
          requirements: ["ACM-1", "ACM-2"],
        },
      ],
    },
    evaluations: [
      {
        assetId: "AS-1",
        requirementId: "ACM-1",
        status: "completed",
        outcome: "PASS",
        path: [{ nodeId: "n1", answer: "yes" }],
      },
      { assetId: "AS-1", requirementId: "ACM-2", status: "completed", outcome: "FAIL", path: [] },
    ],
  });
}

function renderPage() {
  return render(
    <MemoryRouter>
      <ResultPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  queryClient.clear();
  useSessionStore.getState().reset();
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve(JSON.stringify(tree)) }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ResultPage", () => {
  it("blocca l'accesso senza una sessione attiva", () => {
    renderPage();
    expect(screen.getByRole("alert")).toHaveTextContent("Nessuna sessione attiva");
  });

  it("naviga dai risultati all'asset e al percorso logico del requisito", async () => {
    useSessionStore.getState().resume(completedSession());
    renderPage();

    // UC-27: lista asset con esito aggregato (FAIL perché ACM-2 è FAIL).
    const list = screen.getByLabelText("Risultati per asset");
    expect(list).toHaveTextContent("Asset 1 — FAIL");
    fireEvent.click(within(list).getByRole("button", { name: "Dettaglio" }));

    // UC-27.1: riepilogo per asset con requisiti ed esiti.
    const summary = screen.getByLabelText("Riepilogo asset");
    expect(summary).toHaveTextContent("Tipo: network");
    expect(summary).toHaveTextContent("ACM-1 — PASS");
    expect(summary).toHaveTextContent("ACM-2 — FAIL");
    fireEvent.click(within(summary).getAllByRole("button", { name: "Dettaglio" })[0]);

    // UC-27.1.1: percorso logico del requisito.
    const detail = await screen.findByLabelText("Dettaglio requisito con esito");
    await waitFor(() => expect(detail).toHaveTextContent("Domanda 1? → Sì"));
  });
});
