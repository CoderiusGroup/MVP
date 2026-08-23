import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

import type { Session } from "../domain/entities/Session";
import { queryClient } from "../infrastructure/queryClient";
import { useSessionStore } from "../store/SessionStore";
import { ModifySessionPage } from "./ModifySessionPage";

const trees: Record<string, unknown> = {
  "ACM-1": {
    requirementId: "ACM-1",
    requirementName: "Applicability of access control mechanisms",
    rootNode: "n1",
    nodes: [{ id: "n1", type: "leaf", outcome: "PASS" }],
    dependencies: [],
  },
  "ACM-2": {
    requirementId: "ACM-2",
    requirementName: "Appropriate access control mechanisms",
    rootNode: "n1",
    nodes: [{ id: "n1", type: "leaf", outcome: "FAIL" }],
    dependencies: ["ACM-1"],
  },
};

function completedSession(): Session {
  return {
    id: "SES-1",
    savedAt: "2026-08-19T10:00:00Z",
    status: "completed",
    device: {
      id: "DEV-1",
      name: "Device",
      operatingSystem: "OS",
      description: "desc",
      assets: [
        {
          id: "AS-01",
          name: "Interfaccia di rete",
          type: "network",
          description: "d",
          sensitive: false,
          requirements: ["ACM-1", "ACM-2"],
        },
      ],
    },
    evaluations: [
      { assetId: "AS-01", requirementId: "ACM-1", status: "completed", outcome: "PASS", path: [] },
      { assetId: "AS-01", requirementId: "ACM-2", status: "completed", outcome: "FAIL", path: [] },
    ],
  };
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/session/modify"]}>
      <ModifySessionPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  queryClient.clear();
  useSessionStore.getState().reset();
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) => {
      const id = String(url).split("/").pop() ?? "";
      return Promise.resolve({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(trees[id])),
      });
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ModifySessionPage", () => {
  it("lists the requirements of each asset with code and name", async () => {
    useSessionStore.getState().resume(completedSession());
    renderPage();

    await waitFor(() =>
      expect(screen.getByText(/Applicability of access control mechanisms/)).toBeInTheDocument(),
    );
    expect(screen.getByText(/Appropriate access control mechanisms/)).toBeInTheDocument();
  });

  it("redoing a completed requirement invalidates its dependents (cascade)", async () => {
    useSessionStore.getState().resume(completedSession());
    renderPage();

    await waitFor(() =>
      expect(screen.getByText(/Applicability of access control mechanisms/)).toBeInTheDocument(),
    );

    fireEvent.click(screen.getAllByRole("button", { name: "Rivaluta" })[0]);

    const session = useSessionStore.getState().session!;
    const status = (requirementId: string) =>
      session.evaluations.find((e) => e.requirementId === requirementId)?.status;
    expect(status("ACM-1")).toBe("not_evaluated");
    expect(status("ACM-2")).toBe("not_evaluated");
    expect(session.status).toBe("in_progress");
    expect(session.current).toMatchObject({ assetId: "AS-01", requirementId: "ACM-1" });
  });
});
