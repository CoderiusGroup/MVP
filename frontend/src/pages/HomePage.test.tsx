import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import HomePage from "./HomePage";
import { FetchApiClient } from "../infrastructure/FetchApiClient";
import { BrowserRouter } from "react-router-dom";

vi.mock("../infrastructure/FetchApiClient");

const mockedNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockedNavigate,
    };
});

describe("HomePage", () =>{
    const onDeviceSaved = vi.fn();
    const onSessionResumed = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("naviga alla pagina di creazione dispositivo quando si clicca il bottone", async () => {
        render(<BrowserRouter><HomePage onDeviceSaved={onDeviceSaved} onSessionResumed={onSessionResumed}/></BrowserRouter>);
        
        await userEvent.click(screen.getByRole("button", {name: "Crea nuovo dispositivo"}));
        
        expect(mockedNavigate).toHaveBeenCalledWith("/device/new");
    });

    it("carica un dispositivo da un file JSON valido", async () =>{
        const mockDevice = {id:"1", name:"Server1", operatingSystem:"Windows", description:"minecraft server", assets: []};
        vi.mocked(FetchApiClient.prototype.post).mockResolvedValue(mockDevice);

        render(<BrowserRouter><HomePage onDeviceSaved={onDeviceSaved} onSessionResumed={onSessionResumed}/></BrowserRouter>);

        const file = new File(
            [JSON.stringify({name:"Server1", operatingSystem: "Windows", description: "minecraft server"})],
            "device.json",
            {type: "application/json"}
        );

        const input = screen.getByLabelText(/Carica file JSON/i) as HTMLInputElement;
        await userEvent.upload(input, file);

        await waitFor(() =>{
            expect(onDeviceSaved).toHaveBeenCalled();
        });
    });

    it("importa un dispositivo JSON conservando i suoi asset", async () => {
        const mockDeviceShell = {id: "1", name: "Coffee Machine", operatingSystem: "Linux", description: "macchina", assets: []};
        const mockAsset = {id: "AS-1", name: "Modulo Wi-Fi", type: "network", description: "d", sensitive: false, requirements: ["ACM-1"]};
        vi.mocked(FetchApiClient.prototype.post).mockImplementation(async (path: unknown) => {
            return path === "/devices" ? mockDeviceShell : mockAsset;
        });

        render(<BrowserRouter><HomePage onDeviceSaved={onDeviceSaved} onSessionResumed={onSessionResumed}/></BrowserRouter>);

        const fileContent = {
            id: "1",
            name: "Coffee Machine",
            operatingSystem: "Linux",
            description: "macchina",
            assets: [mockAsset],
        };
        const file = new File([JSON.stringify(fileContent)], "device.json", {type: "application/json"});

        const input = screen.getByLabelText(/Carica file JSON/i) as HTMLInputElement;
        await userEvent.upload(input, file);

        await waitFor(() => {
            expect(onDeviceSaved).toHaveBeenCalled();
        });
        const [savedDevice] = onDeviceSaved.mock.calls[0];
        expect(savedDevice.assets).toEqual([mockAsset]);
        expect(FetchApiClient.prototype.post).toHaveBeenCalledWith(
            "/assets",
            expect.objectContaining({ id: "AS-1" }),
        );
    });

    it("importa un dispositivo da un file CSV valido", async () => {
        const mockDeviceShell = {id: "1", name: "Router", operatingSystem: "OpenWRT", description: "router di casa", assets: []};
        vi.mocked(FetchApiClient.prototype.post).mockResolvedValue(mockDeviceShell);

        render(<BrowserRouter><HomePage onDeviceSaved={onDeviceSaved} onSessionResumed={onSessionResumed}/></BrowserRouter>);

        const csv = [
            "device.id,device.name,device.operatingSystem,device.description,asset.id,asset.name,asset.type,asset.description,asset.sensitive,asset.requirements",
            ",Router,OpenWRT,router di casa,,,,,,",
        ].join("\n");
        const file = new File([csv], "device.csv", {type: "text/csv"});

        const input = screen.getByLabelText(/Carica file JSON/i) as HTMLInputElement;
        await userEvent.upload(input, file);

        await waitFor(() => {
            expect(onDeviceSaved).toHaveBeenCalled();
        });
    });

    it("rifiuta un file JSON che contiene un array", async () =>{
        render(<BrowserRouter><HomePage onDeviceSaved={onDeviceSaved} onSessionResumed={onSessionResumed}/></BrowserRouter>);

        const file = new File(
            [JSON.stringify([{name:"Server1", operatingSystem: "Windows"}])],
            "device.json",
            {type: "application/json"}
        );

        const input = screen.getByLabelText(/Carica file JSON/i) as HTMLInputElement;
        await userEvent.upload(input, file);

        await waitFor(() =>{
            expect(onDeviceSaved).not.toHaveBeenCalled();
        });
    });

    it("riprende una sessione da un file JSON valido", async () =>{
        render(<BrowserRouter><HomePage onDeviceSaved={onDeviceSaved} onSessionResumed={onSessionResumed}/></BrowserRouter>);

        const session = {
            id: "SES-1",
            savedAt: "2026-08-19T10:00:00Z",
            status: "in_progress",
            device: { id: "DEV-1", name: "D", operatingSystem: "OS", description: "desc", assets: [] },
            evaluations: [],
            current: { assetId: "AS-1", requirementId: "ACM-1", nodeId: "N1" },
        };
        const file = new File([JSON.stringify(session)], "sessione.json", {type: "application/json"});

        const input = screen.getByLabelText(/Riprendi sessione/i) as HTMLInputElement;
        await userEvent.upload(input, file);

        await waitFor(() =>{
            expect(onSessionResumed).toHaveBeenCalledWith(expect.objectContaining({id: "SES-1"}));
        });
    });

    it("rifiuta un file sessione non valido", async () =>{
        render(<BrowserRouter><HomePage onDeviceSaved={onDeviceSaved} onSessionResumed={onSessionResumed}/></BrowserRouter>);

        const file = new File([JSON.stringify({foo: "bar"})], "sessione.json", {type: "application/json"});

        const input = screen.getByLabelText(/Riprendi sessione/i) as HTMLInputElement;
        await userEvent.upload(input, file);

        await waitFor(() =>{
            expect(onSessionResumed).not.toHaveBeenCalled();
        });
    });
});