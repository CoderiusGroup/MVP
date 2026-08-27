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
        <Route path="/" element={<p>Pagina Home</p>} />
        <Route path="/device" element={<DeviceSummaryPage />} />
        <Route path="/device/edit" element={<p>Pagina modifica dispositivo</p>} />
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

  it("naviga al form di modifica dispositivo (RF-D11-14)", async () => {
    useDeviceStore.getState().setDevice(sampleDevice, {});
    renderPage();

    await userEvent.click(screen.getByRole("button", { name: "Modifica dispositivo" }));

    expect(await screen.findByText("Pagina modifica dispositivo")).toBeInTheDocument();
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

  it("elimina il device dopo conferma e torna alla Home (RF-Ob22/RF-Ob23)", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    useDeviceStore.getState().setDevice(sampleDevice, {});
    renderPage();

    await userEvent.click(screen.getByRole("button", { name: "Elimina dispositivo" }));

    expect(useDeviceStore.getState().device).toBeNull();
    expect(await screen.findByText("Pagina Home")).toBeInTheDocument();
  });

  it("non elimina il device se l'utente annulla la conferma (RF-D03)", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    useDeviceStore.getState().setDevice(sampleDevice, {});
    renderPage();

    await userEvent.click(screen.getByRole("button", { name: "Elimina dispositivo" }));

    expect(useDeviceStore.getState().device).toEqual(sampleDevice);
    expect(screen.getByText("Router1", { exact: false })).toBeInTheDocument();
  });

  it("elimina il device scaricando prima un backup (RF-Ob24)", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const createObjectURL = vi.fn(() => "blob:mock-url");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { ...URL, createObjectURL, revokeObjectURL });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    useDeviceStore.getState().setDevice(sampleDevice, {});
    renderPage();

    await userEvent.click(screen.getByRole("button", { name: "Elimina con backup" }));

    expect(createObjectURL).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(useDeviceStore.getState().device).toBeNull();
    expect(await screen.findByText("Pagina Home")).toBeInTheDocument();
  });

  it("non elimina né scarica nulla se l'utente annulla l'eliminazione con backup (RF-D03)", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const createObjectURL = vi.fn(() => "blob:mock-url");
    vi.stubGlobal("URL", { ...URL, createObjectURL, revokeObjectURL: vi.fn() });

    useDeviceStore.getState().setDevice(sampleDevice, {});
    renderPage();

    await userEvent.click(screen.getByRole("button", { name: "Elimina con backup" }));

    expect(createObjectURL).not.toHaveBeenCalled();
    expect(useDeviceStore.getState().device).toEqual(sampleDevice);
  });
});
