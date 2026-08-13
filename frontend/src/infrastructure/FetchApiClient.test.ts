import { afterEach, describe, expect, it, vi } from "vitest";

import { FetchApiClient } from "./FetchApiClient";

describe("FetchApiClient", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("resolves with the parsed JSON body on a successful GET", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({ id: "t1" })),
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = new FetchApiClient();
    const result = await client.get<{ id: string }>("/decision-trees/t1");

    expect(result).toEqual({ id: "t1" });
    expect(fetchMock).toHaveBeenCalledWith("/decision-trees/t1", { method: "GET" });
  });

  it("throws when a GET response is not ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 404, text: () => Promise.resolve("") }),
    );

    const client = new FetchApiClient();

    await expect(client.get("/decision-trees/missing")).rejects.toThrow();
  });

  it("effettua una POST e restituisce il body parsato", async () => {
    const responseBody = { id: "1", name: "Router1" };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify(responseBody), { status: 201 })),
    );

    const client = new FetchApiClient();
    const result = await client.post("/devices", { name: "Router1" });

    expect(result).toEqual(responseBody);
  });

  it("lancia un errore se la risposta POST non è ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: "Campo name richiesto" }), { status: 400 }),
      ),
    );

    const client = new FetchApiClient();

    await expect(client.post("/devices", {})).rejects.toThrow();
  });
});
