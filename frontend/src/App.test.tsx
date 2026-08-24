import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import App from "./App";
import { useDeviceStore } from "./store/DeviceStore";
import { useSessionStore } from "./store/SessionStore";

beforeEach(() => {
  useDeviceStore.getState().reset();
  useSessionStore.getState().reset();
});

describe("App", () => {
  it("shows HomePage on the default route", () => {
    render(<App />);

    expect(screen.getByText("Gestione Valutazione Dispositivi")).toBeInTheDocument();
  });

  it("populates DeviceStore when resuming a saved session", async () => {
    render(<App />);

    const session = {
      id: "SES-1",
      savedAt: "2026-08-21T10:00:00Z",
      status: "in_progress",
      device: {
        id: "DEV-1",
        name: "Router1",
        operatingSystem: "Linux",
        description: "Router per la casa",
        assets: [],
      },
      evaluations: [],
      current: { assetId: "AS-1", requirementId: "ACM-1", nodeId: "N1" },
    };
    const file = new File([JSON.stringify(session)], "sessione.json", {
      type: "application/json",
    });

    const input = screen.getByLabelText(/Riprendi sessione/i) as HTMLInputElement;
    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(useSessionStore.getState().session).toEqual(session);
    });
    expect(useDeviceStore.getState().device).toEqual(session.device);
  });
});
