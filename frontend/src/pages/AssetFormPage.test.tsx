import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useDeviceStore } from "../store/DeviceStore";
import AssetFormPage from "./AssetFormPage";

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/device/assets/new"]}>
      <Routes>
        <Route path="/device/assets/new" element={<AssetFormPage />} />
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
      expect(useDeviceStore.getState().assets).toEqual([mockAsset]);
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
    expect(useDeviceStore.getState().assets).toEqual([]);
  });
});
