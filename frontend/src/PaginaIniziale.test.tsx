import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PaginaIniziale from "./PaginaIniziale";
import { FetchApiClient } from "./infrastructure/FetchApiClient";

vi.mock("./infrastructure/FetchApiClient");

describe("PaginaIniziale", () =>{
    const onDeviceSaved = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });
    
    it("crea un dispositivo tramite il form", async () =>{
        const mockDevice = {id:"1", name:"Router1", OperatingSystem:"Linux", description:"Router per la casa"};
        vi.mocked(FetchApiClient.prototype.post).mockResolvedValue(mockDevice);

        render(<PaginaIniziale onDeviceSaved={onDeviceSaved}/>);

        await userEvent.type(screen.getByPlaceholderText("Nome"), "Router1");
        await userEvent.type(screen.getByPlaceholderText("Sistema Operativo"), "Linux");
        await userEvent.type(screen.getByPlaceholderText("Descrizione"), "Router per la casa");
        await userEvent.click(screen.getByRole("button", {name: "Invia"}));

        await waitFor(() =>{
            expect(onDeviceSaved).toHaveBeenCalledWith(mockDevice, expect.objectContaining({name: "Router1"}));
        }); 
    });

    it("mostra un errore se il nome è mancante nel form", async() =>{
        render(<PaginaIniziale onDeviceSaved={onDeviceSaved}/>);

        await userEvent.click(screen.getByRole("button", {name:"Invia"}));

        expect(onDeviceSaved).not.toHaveBeenCalled();
    });

    it("carica un dispositivo da un file JSON valido", async () =>{
        const mockDevice = {id:"1", name:"Server1", OperatingSystem:"Windows", description:"minecraft server"};
        vi.mocked(FetchApiClient.prototype.post).mockResolvedValue(mockDevice);

        render(<PaginaIniziale onDeviceSaved={onDeviceSaved}/>);

        const file = new File(
            [JSON.stringify({name:"Server1", OperatingSystem: "Windows"})],
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
        render(<PaginaIniziale onDeviceSaved={onDeviceSaved}/>);

        const file = new File(
            [JSON.stringify([{name:"Server1", OperatingSystem: "Windows"}])],
            "device.json",
            {type: "application/json"}
        );

        const input = screen.getByLabelText(/JSON/i) as HTMLInputElement;
        await userEvent.upload(input, file);

        await waitFor(() =>{
            expect(onDeviceSaved).not.toHaveBeenCalled();
        });
    });
});