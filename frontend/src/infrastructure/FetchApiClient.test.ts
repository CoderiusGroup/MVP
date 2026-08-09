import { describe, it, beforeEach, vi, expect } from "vitest";
import { FetchApiClient } from "./FetchApiClient";


describe("FetchApiClient", () => {
    let client: FetchApiClient;

    beforeEach(() =>{
        client = new FetchApiClient();
        vi.restoreAllMocks();
    });

    it("effettua una POST e restituisce il body parsato", async () =>{
        const responseBody = {id: "1", name:"Router1" };
        vi.spyOn(global, "fetch").mockResolvedValue(
            new Response(JSON.stringify(responseBody), {status: 201})
        );

        const result = await client.post("/devices", {name: "Router1"});
        expect(result).toEqual(responseBody);
    });

    it("lancia un errore se la risposta non è ok", async () =>{
        vi.spyOn(global, "fetch").mockResolvedValue(
            new Response(JSON.stringify({error:"Campo name richiesto"}), {status: 400})
        );

        await expect(client.post("/devices", {})).rejects.toThrow();
    })
});