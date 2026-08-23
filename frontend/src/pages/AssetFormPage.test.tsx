import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Asset } from "../domain/entities/Asset";
import type { Device } from "../domain/entities/Device";
import { useDeviceStore } from "../store/DeviceStore";
import AssetFormPage from "./AssetFormPage";

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
  assets: [],
};

function renderPage(initialEntry = "/device/assets/new") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/device/assets/new" element={<AssetFormPage />} />
        <Route path="/device/assets/:assetId/edit" element={<AssetFormPage />} />
        <Route path="/device/assets" element={<p>Pagina gestione asset</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  useDeviceStore.getState().reset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("AssetFormPage", () => {
  it("creates an asset via the form and stores it in DeviceStore (UC-12)", async () => {
    const mockAsset = {
      id: "AS-1",
      name: "Credenziali utente",
      type: "security",
      description: "Codici PIN memorizzati sul dispositivo.",
      sensitive: true,
      requirements: ["ACM-1"],
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify(mockAsset), { status: 201 })),
    );

    useDeviceStore.getState().setDevice(sampleDevice, {});
    renderPage();

    await userEvent.type(screen.getByPlaceholderText("Nome"), "Credenziali utente");
    await userEvent.selectOptions(screen.getByRole("combobox"), "security");
    await userEvent.type(
      screen.getByPlaceholderText("Descrizione"),
      "Codici PIN memorizzati sul dispositivo.",
    );
    await userEvent.click(screen.getByLabelText("Asset sensibile"));
    await userEvent.click(screen.getByRole("button", { name: "Invia" }));

    await waitFor(() => {
      expect(useDeviceStore.getState().device?.assets).toEqual([mockAsset]);
    });
    expect(await screen.findByText("Pagina gestione asset")).toBeInTheDocument();
  });

  it("does not add the asset and stays on the page when the backend rejects it", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: "Campo type non valido" }), { status: 400 }),
      ),
    );

    useDeviceStore.getState().setDevice(sampleDevice, {});
    renderPage();

    await userEvent.type(screen.getByPlaceholderText("Nome"), "Credenziali utente");
    await userEvent.type(
      screen.getByPlaceholderText("Descrizione"),
      "Codici PIN memorizzati sul dispositivo.",
    );
    await userEvent.click(screen.getByRole("button", { name: "Invia" }));

    await waitFor(() => {
      expect(screen.queryByText("Pagina gestione asset")).not.toBeInTheDocument();
    });
    expect(useDeviceStore.getState().device?.assets).toEqual([]);
  });

  it("shows 'Asset non trovato' when editing an unknown id", () => {
    useDeviceStore.getState().setDevice(sampleDevice, {});

    renderPage("/device/assets/does-not-exist/edit");

    expect(screen.getByText("Asset non trovato.")).toBeInTheDocument();
  });

  it("prefills the form with the existing asset's data in edit mode (RF-D15-19)", () => {
    useDeviceStore.getState().setDevice(sampleDevice, {});
    useDeviceStore.getState().addAsset(sampleAsset);

    renderPage(`/device/assets/${sampleAsset.id}/edit`);

    expect(screen.getByText("Modifica Asset")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Nome")).toHaveValue(sampleAsset.name);
    expect(screen.getByPlaceholderText("Descrizione")).toHaveValue(sampleAsset.description);
    expect(screen.getByLabelText("Asset sensibile")).toBeChecked();
    expect(screen.getByRole("combobox")).toHaveValue(sampleAsset.type);
  });

  it("updates the asset locally without calling the backend when type is unchanged", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    useDeviceStore.getState().setDevice(sampleDevice, {});
    useDeviceStore.getState().addAsset(sampleAsset);

    renderPage(`/device/assets/${sampleAsset.id}/edit`);

    await userEvent.clear(screen.getByPlaceholderText("Nome"));
    await userEvent.type(screen.getByPlaceholderText("Nome"), "Nome aggiornato");
    await userEvent.click(screen.getByRole("button", { name: "Invia" }));

    await waitFor(() => {
      expect(useDeviceStore.getState().device?.assets[0]?.name).toBe("Nome aggiornato");
    });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(useDeviceStore.getState().device?.assets[0]?.requirements).toEqual(
      sampleAsset.requirements,
    );
  });

  it("re-derives requirements via POST /assets when type changes", async () => {
    const updatedAsset = { ...sampleAsset, type: "network", requirements: ["ACM-1", "ACM-2"] };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify(updatedAsset), { status: 201 })),
    );

    useDeviceStore.getState().setDevice(sampleDevice, {});
    useDeviceStore.getState().addAsset(sampleAsset);

    renderPage(`/device/assets/${sampleAsset.id}/edit`);

    await userEvent.selectOptions(screen.getByRole("combobox"), "network");
    await userEvent.click(screen.getByRole("button", { name: "Invia" }));

    await waitFor(() => {
      expect(useDeviceStore.getState().device?.assets).toEqual([updatedAsset]);
    });
    expect(fetch).toHaveBeenCalledWith(
      "/assets",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("does not persist changes when the user goes back without submitting (RF-D05)", async () => {
    useDeviceStore.getState().setDevice(sampleDevice, {});
    useDeviceStore.getState().addAsset(sampleAsset);

    renderPage(`/device/assets/${sampleAsset.id}/edit`);

    await userEvent.clear(screen.getByPlaceholderText("Nome"));
    await userEvent.type(screen.getByPlaceholderText("Nome"), "Nome scartato");
    await userEvent.click(screen.getByRole("button", { name: "Torna indietro" }));

    expect(await screen.findByText("Pagina gestione asset")).toBeInTheDocument();
    expect(useDeviceStore.getState().device?.assets).toEqual([sampleAsset]);
  });
});
