import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DeviceFormPage from "./DeviceFormPage";
import { FetchApiClient } from "../infrastructure/FetchApiClient";
import { BrowserRouter } from "react-router-dom";
import { Device } from "../domain/entities/Device";

vi.mock("../infrastructure/FetchApiClient");

const mockSetDevice = vi.fn();
const mockUpdateDeviceDetails = vi.fn();
let mockDevice: Device | null = null;

vi.mock("../store/DeviceStore", () => ({
    useDeviceStore: (selector: (state: {
        device: Device | null;
        setDevice: typeof mockSetDevice;
        updateDeviceDetails: typeof mockUpdateDeviceDetails;
    }) => unknown) => {
        return selector({
            device: mockDevice,
            setDevice: mockSetDevice,
            updateDeviceDetails: mockUpdateDeviceDetails,
        });
    }
}));

const mockedNavigate = vi.fn();
let mockPathname = "/device/new";
vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockedNavigate,
        useLocation: () => ({ pathname: mockPathname }),
    };
});

describe("DeviceFormPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockDevice = null;
        mockPathname = "/device/new";
    });

    it("crea un dispositivo tramite il form e naviga agli asset", async () => {
        const mockCreatedDevice = {id:"1", name:"Router1", operatingSystem:"Linux", description:"Router per la casa", assets: []};
        vi.mocked(FetchApiClient.prototype.post).mockResolvedValue(mockCreatedDevice);

        render(<BrowserRouter><DeviceFormPage /></BrowserRouter>);

        await userEvent.type(screen.getByPlaceholderText("Nome"), "Router1");
        await userEvent.type(screen.getByPlaceholderText("Sistema Operativo"), "Linux");
        await userEvent.type(screen.getByPlaceholderText("Descrizione"), "Router per la casa");
        await userEvent.click(screen.getByRole("button", {name: /Salva e procedi/i}));

        await waitFor(() => {
            expect(mockSetDevice).toHaveBeenCalled();
            expect(mockedNavigate).toHaveBeenCalledWith("/device/assets");
        });
        const [calledDevice, calledPayload] = mockSetDevice.mock.calls[0];
        expect(calledDevice.toJSON()).toEqual(mockCreatedDevice);
        expect(calledPayload).toEqual(expect.objectContaining({ name: "Router1" }));
    });

    it("mostra un errore HTML nativo (required) se il nome o SO sono mancanti", async () => {
        render(<BrowserRouter><DeviceFormPage /></BrowserRouter>);

        const btn = screen.getByRole("button", {name: /Salva e procedi/i});
        await userEvent.click(btn);

        expect(mockSetDevice).not.toHaveBeenCalled();
    });

    it("precompila il form con i dati esistenti in modalità modifica (RF-D11-14)", () => {
        mockPathname = "/device/edit";
        mockDevice = Device.create({ id: "1", name: "Router1", operatingSystem: "Linux", description: "Router per la casa", assets: [] });

        render(<BrowserRouter><DeviceFormPage /></BrowserRouter>);

        expect(screen.getByText("Modifica dispositivo")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Nome")).toHaveValue("Router1");
        expect(screen.getByPlaceholderText("Sistema Operativo")).toHaveValue("Linux");
        expect(screen.getByPlaceholderText("Descrizione")).toHaveValue("Router per la casa");
    });

    it("in modalità modifica salva localmente senza chiamare il backend e torna al riepilogo", async () => {
        mockPathname = "/device/edit";
        mockDevice = Device.create({ id: "1", name: "Router1", operatingSystem: "Linux", description: "Router per la casa", assets: [] });

        render(<BrowserRouter><DeviceFormPage /></BrowserRouter>);

        await userEvent.clear(screen.getByPlaceholderText("Nome"));
        await userEvent.type(screen.getByPlaceholderText("Nome"), "Router aggiornato");
        await userEvent.click(screen.getByRole("button", { name: "Salva modifiche" }));

        await waitFor(() => {
            expect(mockUpdateDeviceDetails).toHaveBeenCalledWith(
                expect.objectContaining({ name: "Router aggiornato" }),
            );
            expect(mockedNavigate).toHaveBeenCalledWith("/device");
        });
        expect(FetchApiClient.prototype.post).not.toHaveBeenCalled();
        expect(mockSetDevice).not.toHaveBeenCalled();
    });

    it("in modalità modifica 'Torna indietro' non salva nulla (RF-D02)", async () => {
        mockPathname = "/device/edit";
        mockDevice = Device.create({ id: "1", name: "Router1", operatingSystem: "Linux", description: "Router per la casa", assets: [] });

        render(<BrowserRouter><DeviceFormPage /></BrowserRouter>);

        await userEvent.clear(screen.getByPlaceholderText("Nome"));
        await userEvent.type(screen.getByPlaceholderText("Nome"), "Nome scartato");
        await userEvent.click(screen.getByRole("button", { name: "Torna indietro" }));

        expect(mockUpdateDeviceDetails).not.toHaveBeenCalled();
        expect(mockedNavigate).toHaveBeenCalledWith("/device");
    });
});
