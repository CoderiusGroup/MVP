import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useTreeStore } from "../store/TreeStore";
import { useDecisionTree } from "./useDecisionTree";

const sampleTreeResponse = {
  requirementId: "ACM-1",
  requirementName: "Sample",
  rootNode: "n1",
  nodes: [{ id: "n1", type: "leaf", outcome: "PASS" }],
};

beforeEach(() => {
  useTreeStore.getState().reset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useDecisionTree", () => {
  it("fetches the tree and populates the TreeStore", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(sampleTreeResponse),
      }),
    );

    const { result } = renderHook(() => useDecisionTree("ACM-1"));

    await waitFor(() => expect(result.current.status).toBe("idle"));

    expect(useTreeStore.getState().tree?.requirementId).toBe("ACM-1");
    expect(useTreeStore.getState().currentNodeId).toBe("n1");
  });

  it("sets status to error when the fetch fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));

    const { result } = renderHook(() => useDecisionTree("ACM-1"));

    await waitFor(() => expect(result.current.status).toBe("error"));
  });
});
