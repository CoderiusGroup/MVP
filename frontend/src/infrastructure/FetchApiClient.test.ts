import { afterEach, describe, expect, it, vi } from "vitest";

import { FetchApiClient } from "./FetchApiClient";

describe("FetchApiClient", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("resolves with the parsed JSON body on a successful GET", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: "t1" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = new FetchApiClient();
    const result = await client.get<{ id: string }>("/decision-trees/t1");

    expect(result).toEqual({ id: "t1" });
    expect(fetchMock).toHaveBeenCalledWith("/decision-trees/t1");
  });

  it("throws when the response is not ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 404 }),
    );

    const client = new FetchApiClient();

    await expect(client.get("/decision-trees/missing")).rejects.toThrow("404");
  });
});
