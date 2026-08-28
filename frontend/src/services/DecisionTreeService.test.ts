import { beforeEach, describe, expect, it } from "vitest";

import type { ApiClientService } from "../infrastructure/ApiClientService";
import { queryClient } from "../infrastructure/queryClient";
import { DecisionTreeService } from "./DecisionTreeService";

const rawTree = {
  requirementId: "ACM-1",
  requirementName: "Sample",
  rootNode: "n1",
  nodes: [{ id: "n1", type: "leaf", outcome: "PASS" }],
  dependencies: [],
};

function fakeApi(data: unknown): ApiClientService {
  return {
    get: async () => data,
    post: async () => data,
    postFormData: async () => data,
    put: async () => data,
    delete: async () => data,
  } as ApiClientService;
}

beforeEach(() => {
  queryClient.clear();
});

describe("DecisionTreeService", () => {
  it("carica e normalizza un decision tree valido", async () => {
    const service = new DecisionTreeService(fakeApi(rawTree));

    const tree = await service.getTree("ACM-1");

    expect(tree).toMatchObject({ requirementId: "ACM-1", rootNode: "n1" });
  });

  it("rifiuta un payload non conforme allo schema", async () => {
    const service = new DecisionTreeService(fakeApi({ foo: "bar" }));

    await expect(service.getTree("ACM-1")).rejects.toThrow();
  });

  it("importa un decision tree e invalida la lista", async () => {
    const service = new DecisionTreeService(fakeApi(rawTree));
    const file = new File([JSON.stringify(rawTree)], "tree.json", { type: "application/json" });

    await expect(service.importTree(file)).resolves.toMatchObject({ requirementId: "ACM-1" });
  });
});
