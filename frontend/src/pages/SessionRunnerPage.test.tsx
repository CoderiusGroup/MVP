import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

import { Session } from "../domain/entities/Session";
import { queryClient } from "../infrastructure/queryClient";
import { useSessionStore } from "../store/SessionStore";
import { useTreeStore } from "../store/TreeStore";
import { SessionRunnerPage } from "./SessionRunnerPage";

const acmTree = {
  requirementId: "ACM-1",
  requirementName: "Sample",
  rootNode: "n1",
  nodes: [
    { id: "n1", type: "question", text: "Domanda 1?", branches: { yes: "n2", no: "n3" } },
    { id: "n2", type: "leaf", outcome: "PASS" },
    { id: "n3", type: "leaf", outcome: "FAIL" },
  ],
};

const dependentTree = {
  requirementId: "ACM-2",
  requirementName: "Dependent",
  rootNode: "n1",
  dependencies: ["ACM-1"],
  nodes: [
    { id: "n1", type: "question", text: "Domanda 2?", branches: { yes: "n2", no: "n3" } },
    { id: "n2", type: "leaf", outcome: "PASS" },
    { id: "n3", type: "leaf", outcome: "FAIL" },
  ],
};

function device(assets: ReturnType<typeof asset>[]) {
  return { id: "DEV-1", name: "Device", operatingSystem: "OS", description: "desc", assets };
}

const asset = (id: string, requirements: string[]) => ({
  id,
  name: `Asset ${id}`,
  type: "network" as const,
  description: "d",
  sensitive: false,
  requirements,
});

function baseSession(overrides: Record<string, unknown> = {}): Session {
  return Session.parse({
    id: "SES-1",
    savedAt: "2026-08-19T10:00:00Z",
    status: "in_progress",
    device: device([asset("AS-1", ["ACM-1"])]),
    evaluations: [{ assetId: "AS-1", requirementId: "ACM-1", status: "not_evaluated" }],
    current: { assetId: "AS-1", requirementId: "ACM-1", nodeId: "n1" },
    ...overrides,
  });
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/session"]}>
      <SessionRunnerPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  queryClient.clear();
  useSessionStore.getState().reset();
  useTreeStore.getState().reset();
  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation((url: string) => {
      const body = String(url).includes("ACM-2") ? dependentTree : acmTree;
      return Promise.resolve({ ok: true, text: () => Promise.resolve(JSON.stringify(body)) });
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("SessionRunnerPage", () => {
  it("blocca l'accesso senza una sessione attiva (route guard)", () => {
    renderPage();
    expect(screen.getByRole("alert")).toHaveTextContent("Nessuna sessione attiva");
  });

  it("guida dalla dashboard all'esito, torna alla vista asset e completa la sessione", async () => {
    useSessionStore.getState().resume(
      baseSession({
        device: device([asset("AS-1", ["ACM-1"]), asset("AS-2", ["ACM-1"])]),
        evaluations: [
          { assetId: "AS-1", requirementId: "ACM-1", status: "not_evaluated" },
          { assetId: "AS-2", requirementId: "ACM-1", status: "not_evaluated" },
        ],
      }),
    );
    renderPage();

    // Dashboard: progresso e lista asset.
    expect(screen.getByText("Asset completati: 0 / 2")).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "Valuta" })[0]);

    // Vista asset: info e requisiti con stato.
    const assetView = screen.getByLabelText("Asset in valutazione");
    expect(within(assetView).getByRole("heading", { name: "Asset AS-1" })).toBeInTheDocument();
    expect(assetView).toHaveTextContent("ACM-1 — Non valutato");
    fireEvent.click(within(assetView).getByRole("button", { name: "Apri" }));

    // Dettaglio requisito: codice + nome.
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "ACM-1 — Sample" })).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Avvia decision tree" }));

    // Albero: codice nodo + domanda, poi foglia.
    await waitFor(() =>
      expect(
        within(screen.getByLabelText("Domanda corrente")).getByText("Domanda 1?"),
      ).toBeInTheDocument(),
    );
    expect(screen.getByLabelText("Domanda corrente")).toHaveTextContent(/Nodo:\s*n1/);
    fireEvent.click(screen.getByRole("button", { name: "Sì" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Conferma esito" })).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Conferma esito" }));

    // Ritorno alla vista asset con l'esito registrato.
    const afterAsset = screen.getByLabelText("Asset in valutazione");
    expect(afterAsset).toHaveTextContent("ACM-1 — PASS");
    fireEvent.click(within(afterAsset).getByRole("button", { name: "Torna alla dashboard" }));
    expect(screen.getByText("Asset completati: 1 / 2")).toBeInTheDocument();

    // Valuta il secondo asset fino al completamento della sessione.
    fireEvent.click(screen.getAllByRole("button", { name: "Valuta" })[1]);
    fireEvent.click(screen.getByRole("button", { name: "Apri" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Avvia decision tree" })).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Avvia decision tree" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Sì" })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Sì" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Conferma esito" })).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Conferma esito" }));

    await waitFor(() => expect(screen.getByText("Valutazione completata")).toBeInTheDocument());
    expect(useSessionStore.getState().session!.status).toBe("completed");
  });

  it("mostra le dipendenze del requisito con il loro stato prima dell'avvio (RF-Ob52)", async () => {
    useSessionStore.getState().resume(
      baseSession({
        device: device([asset("AS-1", ["ACM-1", "ACM-2"])]),
        evaluations: [
          { assetId: "AS-1", requirementId: "ACM-1", status: "completed", outcome: "PASS" },
          { assetId: "AS-1", requirementId: "ACM-2", status: "not_evaluated" },
        ],
        current: { assetId: "AS-1", requirementId: "ACM-2", nodeId: "" },
      }),
    );
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Valuta" }));
    const assetView = screen.getByLabelText("Asset in valutazione");
    expect(within(assetView).getByRole("button", { name: "Completato" })).toBeDisabled();
    fireEvent.click(within(assetView).getByRole("button", { name: "Apri" }));

    const detail = await screen.findByLabelText("Dettaglio requisito");
    expect(within(detail).getByRole("heading", { name: "ACM-2 — Dependent" })).toBeInTheDocument();
    expect(detail).toHaveTextContent("ACM-1 — PASS");
  });

  it("riprende una sessione interrotta entrando direttamente nell'albero (UC-26)", async () => {
    useSessionStore.getState().resume(
      baseSession({
        evaluations: [
          {
            assetId: "AS-1",
            requirementId: "ACM-1",
            status: "in_progress",
            path: [{ nodeId: "n1", answer: "yes" }],
          },
        ],
        current: { assetId: "AS-1", requirementId: "ACM-1", nodeId: "n2" },
      }),
    );
    renderPage();

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Conferma esito" })).toBeInTheDocument(),
    );
    expect(within(screen.getByLabelText("Esito requisito")).getByText("PASS"),).toBeInTheDocument();
  });

  it("permette l'uscita anticipata scartando la sessione (RF-Ob69)", () => {
    useSessionStore.getState().resume(baseSession());
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Esci dal test" }));
    fireEvent.click(screen.getByRole("button", { name: "Esci senza salvare" }));

    expect(useSessionStore.getState().session).toBeNull();
    expect(useTreeStore.getState().tree).toBeNull();
  });
});
