import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Asset } from "../domain/entities/Asset";
import type { Device } from "../domain/entities/Device";
import type { Session } from "../domain/entities/Session";
import { useDeviceStore } from "../store/DeviceStore";
import { useSessionStore } from "../store/SessionStore";
import DeviceSummaryPage from "./DeviceSummaryPage";

const sampleAsset: Asset = {
  id: "AS-1",
  name: "Credenziali utente",
  type: "security",
  description: "Codici PIN memorizzati sul dispositivo.",
  sensitive: true,
  requirements: ["ACM-1"],
};

const sampleDevice: Device = {
  id: "DEV-1",
  name: "Router1",
  operatingSystem: "Linux",
  description: "Router per la casa",
  assets: [sampleAsset],
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/device"]}>
      <Routes>
        <Route path="/device" element={<DeviceSummaryPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  useDeviceStore.getState().reset();
  useSessionStore.getState().reset();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("DeviceSummaryPage", () => {
  it("shows a message when there is no device", () => {
    renderPage();

    expect(screen.getByText("Nessun dispositivo disponibile.")).toBeInTheDocument();
  });

  it("shows 'Non valutato' when there is no session yet (RF-Ob18)", () => {
    useDeviceStore.getState().setDevice(sampleDevice, {});

    renderPage();

    expect(screen.getByText("Non valutato")).toBeInTheDocument();
  });

  it("shows the aggregated status derived from the session (RF-Ob18)", () => {
    useDeviceStore.getState().setDevice(sampleDevice, {});
    const session: Session = {
      id: "SES-1",
      savedAt: "2026-08-21T10:00:00Z",
      status: "in_progress",
      device: sampleDevice,
      evaluations: [
        { assetId: sampleAsset.id, requirementId: "ACM-1", status: "completed", outcome: "FAIL" },
      ],
    };
    useSessionStore.getState().resume(session);

    renderPage();

    expect(screen.getByText("FAIL")).toBeInTheDocument();
  });

  it("esporta il device in JSON (RF-Ob20)", async () => {
    const createObjectURL = vi.fn(() => "blob:mock-url");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { ...URL, createObjectURL, revokeObjectURL });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    useDeviceStore.getState().setDevice(sampleDevice, {});
    renderPage();

    await userEvent.click(screen.getByRole("button", { name: "Esporta in JSON" }));

    expect(createObjectURL).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
  });

  it("esporta il device in CSV (RF-Ob21)", async () => {
    const createObjectURL = vi.fn(() => "blob:mock-url");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { ...URL, createObjectURL, revokeObjectURL });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    useDeviceStore.getState().setDevice(sampleDevice, {});
    renderPage();

    await userEvent.click(screen.getByRole("button", { name: "Esporta in CSV" }));

    expect(createObjectURL).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
  });
});
