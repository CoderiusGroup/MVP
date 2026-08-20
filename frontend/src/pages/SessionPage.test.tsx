import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

import type { Session } from "../domain/entities/Session";
import { useSessionStore } from "../store/SessionStore";
import { useTreeStore } from "../store/TreeStore";
import { SessionPage } from "./SessionPage";

const treeResponse = {
  requirementId: "ACM-1",
  requirementName: "Sample",
  rootNode: "n1",
  nodes: [
    { id: "n1", type: "question", text: "Domanda 1?", branches: { yes: "n2", no: "n3" } },
    { id: "n2", type: "leaf", outcome: "PASS" },
    { id: "n3", type: "leaf", outcome: "FAIL" },
  ],
};

function baseSession(overrides: Partial<Session> = {}): Session {
  return {
    id: "SES-1",
    savedAt: "2026-08-19T10:00:00Z",
    status: "in_progress",
    device: {
      id: "DEV-1",
      name: "Device",
      operatingSystem: "OS",
      description: "desc",
      assets: [
        {
          id: "AS-1",
          name: "Asset 1",
          type: "network",
          description: "d",
          sensitive: false,
          requirements: ["ACM-1"],
        },
      ],
    },
    evaluations: [{ assetId: "AS-1", requirementId: "ACM-1", status: "not_evaluated" }],
    current: { assetId: "AS-1", requirementId: "ACM-1", nodeId: "n1" },
    ...overrides,
  };
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/session"]}>
      <SessionPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  useSessionStore.getState().reset();
  useTreeStore.getState().reset();
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify(treeResponse)),
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("SessionPage", () => {
  it("blocks access when no session is active (route guard)", () => {
    renderPage();
    expect(screen.getByRole("alert")).toHaveTextContent("Nessuna sessione attiva");
  });

  it("runs a requirement to its leaf and completes the session", async () => {
    useSessionStore.getState().resume(baseSession());
    renderPage();

    await waitFor(() => expect(screen.getByText("Domanda 1?")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Sì" }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Prossimo requisito" })).toBeInTheDocument(),
    );
    expect(screen.getByText("PASS")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Prossimo requisito" }));

    await waitFor(() => expect(screen.getByText("Valutazione completata")).toBeInTheDocument());
    expect(useSessionStore.getState().session!.status).toBe("completed");
  });

  it("restarts from the root when the next asset reuses the same requirement", async () => {
    const twoAssets = baseSession({
      device: {
        id: "DEV-1",
        name: "Device",
        operatingSystem: "OS",
        description: "desc",
        assets: [
          { id: "AS-1", name: "Asset 1", type: "network", description: "d", sensitive: false, requirements: ["ACM-1"] },
          { id: "AS-2", name: "Asset 2", type: "security", description: "d", sensitive: true, requirements: ["ACM-1"] },
        ],
      },
      evaluations: [
        { assetId: "AS-1", requirementId: "ACM-1", status: "not_evaluated" },
        { assetId: "AS-2", requirementId: "ACM-1", status: "not_evaluated" },
      ],
      current: { assetId: "AS-1", requirementId: "ACM-1", nodeId: "n1" },
    });
    useSessionStore.getState().resume(twoAssets);
    renderPage();

    await waitFor(() => expect(screen.getByText("Domanda 1?")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Sì" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Prossimo requisito" })).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole("button", { name: "Prossimo requisito" }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Sì" })).toBeInTheDocument(),
    );
    expect(screen.getByText("Domanda 1?")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Prossimo requisito" })).toBeNull();
  });

  it("resumes a saved session on the node reached by its recorded path", async () => {
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
      expect(screen.getByRole("button", { name: "Prossimo requisito" })).toBeInTheDocument(),
    );
    expect(screen.getByText("PASS")).toBeInTheDocument();
  });
});
