import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DeviceFormPage from "./DeviceFormPage";
import { FetchApiClient } from "../infrastructure/FetchApiClient";
import { BrowserRouter } from "react-router-dom";

vi.mock("../infrastructure/FetchApiClient");

const mockSetDevice = vi.fn();
vi.mock("../store/DeviceStore", () => ({
    useDeviceStore: (selector: (state: { setDevice: typeof mockSetDevice }) => unknown) => {
        return selector({ setDevice: mockSetDevice });
    }
}));

const mockedNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockedNavigate,
    };
});

describe("DeviceFormPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("crea un dispositivo tramite il form e naviga agli asset", async () => {
        const mockDevice = {id:"1", name:"Router1", operatingSystem:"Linux", description:"Router per la casa", assets: []};
        vi.mocked(FetchApiClient.prototype.post).mockResolvedValue(mockDevice);

        render(<BrowserRouter><DeviceFormPage /></BrowserRouter>);

        await userEvent.type(screen.getByPlaceholderText("Nome"), "Router1");
        await userEvent.type(screen.getByPlaceholderText("Sistema Operativo"), "Linux");
        await userEvent.type(screen.getByPlaceholderText("Descrizione"), "Router per la casa");
        await userEvent.click(screen.getByRole("button", {name: /Salva e procedi/i}));

        await waitFor(() => {
            expect(mockSetDevice).toHaveBeenCalledWith(mockDevice, expect.objectContaining({ name: "Router1" }));
            expect(mockedNavigate).toHaveBeenCalledWith("/device/assets");
        });
    });

    it("mostra un errore HTML nativo (required) se il nome o SO sono mancanti", async () => {
        render(<BrowserRouter><DeviceFormPage /></BrowserRouter>);
        
        const btn = screen.getByRole("button", {name: /Salva e procedi/i});
        await userEvent.click(btn);

        expect(mockSetDevice).not.toHaveBeenCalled();
    });
});