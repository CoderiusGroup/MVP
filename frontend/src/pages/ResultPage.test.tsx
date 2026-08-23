import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";

import type { Session } from "../domain/entities/Session";
import { useSessionStore } from "../store/SessionStore";
import { ResultPage } from "./ResultPage";

function completedSession(): Session {
  return {
    id: "SES-1",
    savedAt: "2026-08-19T10:00:00Z",
    status: "completed",
    device: { id: "DEV-1", name: "D", operatingSystem: "OS", description: "d", assets: [] },
    evaluations: [
      { assetId: "AS-01", requirementId: "ACM-1", status: "completed", outcome: "PASS" },
      { assetId: "AS-01", requirementId: "ACM-2", status: "completed", outcome: "FAIL" },
    ],
  };
}

function renderPage() {
  return render(
    <MemoryRouter>
      <ResultPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  useSessionStore.getState().reset();
});

describe("ResultPage", () => {
  it("blocca l'accesso senza una sessione attiva", () => {
    renderPage();

    expect(screen.getByRole("alert")).toHaveTextContent("Nessuna sessione attiva");
  });

  it("mostra il riepilogo degli esiti della sessione completata", () => {
    useSessionStore.getState().resume(completedSession());

    renderPage();

    expect(screen.getByText("Valutazione completata")).toBeInTheDocument();
    expect(screen.getByText("PASS")).toBeInTheDocument();
    expect(screen.getByText("FAIL")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Salva sessione" })).toBeInTheDocument();
  });
});
