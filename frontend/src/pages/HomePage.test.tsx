import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import HomePage from "./HomePage";
import { FetchApiClient } from "../infrastructure/FetchApiClient";

vi.mock("../infrastructure/FetchApiClient");

describe("HomePage", () =>{
    const onDeviceSaved = vi.fn();
    const onSessionResumed = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("crea un dispositivo tramite il form", async () =>{
        const mockDevice = {id:"1", name:"Router1", operatingSystem:"Linux", description:"Router per la casa", assets: []};
        vi.mocked(FetchApiClient.prototype.post).mockResolvedValue(mockDevice);

        render(<HomePage onDeviceSaved={onDeviceSaved} onSessionResumed={onSessionResumed}/>);

        await userEvent.type(screen.getByPlaceholderText("Nome"), "Router1");
        await userEvent.type(screen.getByPlaceholderText("Sistema Operativo"), "Linux");
        await userEvent.type(screen.getByPlaceholderText("Descrizione"), "Router per la casa");
        await userEvent.click(screen.getByRole("button", {name: "Invia"}));

        await waitFor(() =>{
            expect(onDeviceSaved).toHaveBeenCalledWith(mockDevice, expect.objectContaining({name: "Router1"}));
        });
    });

    it("mostra un errore se il nome è mancante nel form", async() =>{
        render(<HomePage onDeviceSaved={onDeviceSaved} onSessionResumed={onSessionResumed}/>);

        await userEvent.click(screen.getByRole("button", {name:"Invia"}));

        expect(onDeviceSaved).not.toHaveBeenCalled();
    });

    it("carica un dispositivo da un file JSON valido", async () =>{
        const mockDevice = {id:"1", name:"Server1", operatingSystem:"Windows", description:"minecraft server", assets: []};
        vi.mocked(FetchApiClient.prototype.post).mockResolvedValue(mockDevice);

        render(<HomePage onDeviceSaved={onDeviceSaved} onSessionResumed={onSessionResumed}/>);

        const file = new File(
            [JSON.stringify({name:"Server1", operatingSystem: "Windows"})],
            "device.json",
            {type: "application/json"}
        );

        const input = screen.getByLabelText(/JSON/i) as HTMLInputElement;
        await userEvent.upload(input, file);

        await waitFor(() =>{
            expect(onDeviceSaved).toHaveBeenCalled();
        });
    });

    it("rifiuta un file JSON che contiene un array", async () =>{
        render(<HomePage onDeviceSaved={onDeviceSaved} onSessionResumed={onSessionResumed}/>);

        const file = new File(
            [JSON.stringify([{name:"Server1", operatingSystem: "Windows"}])],
            "device.json",
            {type: "application/json"}
        );

        const input = screen.getByLabelText(/JSON/i) as HTMLInputElement;
        await userEvent.upload(input, file);

        await waitFor(() =>{
            expect(onDeviceSaved).not.toHaveBeenCalled();
        });
    });

    it("riprende una sessione da un file JSON valido", async () =>{
        render(<HomePage onDeviceSaved={onDeviceSaved} onSessionResumed={onSessionResumed}/>);

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
        render(<HomePage onDeviceSaved={onDeviceSaved} onSessionResumed={onSessionResumed}/>);

        const file = new File([JSON.stringify({foo: "bar"})], "sessione.json", {type: "application/json"});

        const input = screen.getByLabelText(/Riprendi sessione/i) as HTMLInputElement;
        await userEvent.upload(input, file);

        await waitFor(() =>{
            expect(onSessionResumed).not.toHaveBeenCalled();
        });
    });
});
