import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Asset } from "../domain/entities/Asset";
import type { Device } from "../domain/entities/Device";
import type { Session } from "../domain/entities/Session";
import { useDeviceStore } from "../store/DeviceStore";
import { useSessionStore } from "../store/SessionStore";
import DeviceAssetManagementPage from "./DeviceAssetManagementPage";

const sampleDevice: Device = {
  id: "DEV-1",
  name: "Router1",
  operatingSystem: "Linux",
  description: "Router per la casa",
  assets: [],
};

const sampleAsset: Asset = {
  id: "AS-1",
  name: "Credenziali utente",
  type: "security",
  description: "Codici PIN memorizzati sul dispositivo.",
  sensitive: true,
  requirements: ["ACM-1"],
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/device/assets"]}>
      <Routes>
        <Route path="/device/assets" element={<DeviceAssetManagementPage />} />
        <Route path="/device/assets/new" element={<p>Pagina nuovo asset</p>} />
        <Route path="/device" element={<p>Pagina device</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  useDeviceStore.getState().reset();
  useSessionStore.getState().reset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("DeviceAssetManagementPage", () => {
  it("shows a message when there are no assets (UC-14)", () => {
    useDeviceStore.getState().setDevice(sampleDevice, {});

    renderPage();

    expect(screen.getByText("Nessun asset presente.")).toBeInTheDocument();
  });

  it("lists the name and type of each asset (UC-14.1)", () => {
    useDeviceStore.getState().setDevice(sampleDevice, {});
    useDeviceStore.getState().addAsset(sampleAsset);

    renderPage();

    expect(screen.getByText("Credenziali utente", { exact: false })).toBeInTheDocument();
    expect(screen.getByText(/security/)).toBeInTheDocument();
  });

  it("shows 'Non valutato' next to each asset when no session exists (RF-Ob35)", () => {
    useDeviceStore.getState().setDevice(sampleDevice, {});
    useDeviceStore.getState().addAsset(sampleAsset);

    renderPage();

    expect(screen.getByText(/Non valutato/)).toBeInTheDocument();
  });

  it("shows the asset status derived from the session (RF-Ob35)", () => {
    useDeviceStore.getState().setDevice(sampleDevice, {});
    useDeviceStore.getState().addAsset(sampleAsset);
    const session: Session = {
      id: "SES-1",
      savedAt: "2026-08-21T10:00:00Z",
      status: "in_progress",
      device: { ...sampleDevice, assets: [sampleAsset] },
      evaluations: [
        { assetId: sampleAsset.id, requirementId: "ACM-1", status: "completed", outcome: "FAIL" },
      ],
    };
    useSessionStore.getState().resume(session);

    renderPage();

    expect(screen.getByText(/FAIL/)).toBeInTheDocument();
  });

  it("navigates to the asset form when adding a new asset", async () => {
    useDeviceStore.getState().setDevice(sampleDevice, {});

    renderPage();
    await userEvent.click(screen.getByRole("button", { name: "Aggiungi asset" }));

    expect(await screen.findByText("Pagina nuovo asset")).toBeInTheDocument();
  });

  it("does not show detail fields until the asset is selected (UC-15)", () => {
    useDeviceStore.getState().setDevice(sampleDevice, {});
    useDeviceStore.getState().addAsset(sampleAsset);

    renderPage();

    expect(screen.queryByText(/Descrizione:/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Credenziali utente/ })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("reveals description, sensitivity and requirements when the asset is selected (UC-15.6)", async () => {
    useDeviceStore.getState().setDevice(sampleDevice, {});
    useDeviceStore.getState().addAsset(sampleAsset);

    renderPage();
    await userEvent.click(screen.getByRole("button", { name: /Credenziali utente/ }));

    expect(screen.getByText(sampleAsset.description)).toBeInTheDocument();
    expect(screen.getByText("Sì", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("ACM-1", { exact: false })).toBeInTheDocument();
  });

  it("shows the status of each requirement in the detail view (RF-Ob43)", async () => {
    useDeviceStore.getState().setDevice(sampleDevice, {});
    useDeviceStore.getState().addAsset(sampleAsset);
    const session: Session = {
      id: "SES-1",
      savedAt: "2026-08-21T10:00:00Z",
      status: "in_progress",
      device: { ...sampleDevice, assets: [sampleAsset] },
      evaluations: [
        { assetId: sampleAsset.id, requirementId: "ACM-1", status: "completed", outcome: "PASS" },
      ],
    };
    useSessionStore.getState().resume(session);

    renderPage();
    await userEvent.click(screen.getByRole("button", { name: /Credenziali utente/ }));

    expect(screen.getByText(/ACM-1.*PASS/)).toBeInTheDocument();
  });

  it("collapses the detail again on a second selection", async () => {
    useDeviceStore.getState().setDevice(sampleDevice, {});
    useDeviceStore.getState().addAsset(sampleAsset);

    renderPage();
    const toggle = screen.getByRole("button", { name: /Credenziali utente/ });
    await userEvent.click(toggle);
    await userEvent.click(toggle);

    expect(screen.queryByText(/Descrizione:/)).not.toBeInTheDocument();
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  it("shows 'Nessuno' when the asset has no derived requirements", async () => {
    useDeviceStore.getState().setDevice(sampleDevice, {});
    useDeviceStore.getState().addAsset({ ...sampleAsset, requirements: [] });

    renderPage();
    await userEvent.click(screen.getByRole("button", { name: /Credenziali utente/ }));

    expect(screen.getByText("Nessuno")).toBeInTheDocument();
  });

  it("removes an asset after confirmation (UC-18)", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    useDeviceStore.getState().setDevice(sampleDevice, {});
    useDeviceStore.getState().addAsset(sampleAsset);

    renderPage();
    await userEvent.click(screen.getByRole("button", { name: "Rimuovi" }));

    expect(useDeviceStore.getState().device?.assets).toEqual([]);
  });

  it("keeps the asset when the user cancels the confirmation", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    useDeviceStore.getState().setDevice(sampleDevice, {});
    useDeviceStore.getState().addAsset(sampleAsset);

    renderPage();
    await userEvent.click(screen.getByRole("button", { name: "Rimuovi" }));

    expect(useDeviceStore.getState().device?.assets).toEqual([sampleAsset]);
  });
});
