import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { Session } from "../domain/entities/Session";
import { useSessionStore } from "../store/SessionStore";
import { RequireSession } from "./RequireSession";

const session = Session.parse({
  id: "SES-1",
  savedAt: "2026-08-19T10:00:00Z",
  status: "in_progress",
  device: { id: "DEV-1", name: "D", operatingSystem: "OS", description: "d", assets: [] },
  evaluations: [],
});

function renderGuarded() {
  return render(
    <MemoryRouter initialEntries={["/session"]}>
      <Routes>
        <Route path="/" element={<p>Pagina Home</p>} />
        <Route
          path="/session"
          element={
            <RequireSession>
              <p>Contenuto sessione</p>
            </RequireSession>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  useSessionStore.getState().reset();
});

describe("RequireSession", () => {
  it("reindirizza alla Home quando non c'è una sessione attiva", () => {
    renderGuarded();

    expect(screen.getByText("Pagina Home")).toBeInTheDocument();
    expect(screen.queryByText("Contenuto sessione")).not.toBeInTheDocument();
  });

  it("mostra il contenuto quando la sessione è attiva", () => {
    useSessionStore.getState().resume(session);

    renderGuarded();

    expect(screen.getByText("Contenuto sessione")).toBeInTheDocument();
  });
});
