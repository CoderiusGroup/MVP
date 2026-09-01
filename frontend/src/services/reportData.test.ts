import { beforeEach, describe, expect, it, vi } from "vitest";

import { DecisionTree } from "../domain/entities/DecisionTree";
import { Session } from "../domain/entities/Session";
import { decisionTreeService } from "./DecisionTreeService";
import { buildReportData } from "./reportData";

vi.mock("./DecisionTreeService", () => ({
  decisionTreeService: { getTree: vi.fn() },
}));

const acmTree = DecisionTree.create({
  requirementId: "ACM-1",
  requirementName: "Access control mechanism",
  rootNode: "n1",
  nodes: [
    { id: "n1", type: "question", text: "Domanda 1?", branches: { yes: "n2", no: "n3" } },
    { id: "n2", type: "leaf", outcome: "PASS" },
    { id: "n3", type: "leaf", outcome: "FAIL" },
  ],
});

function session(): Session {
  return Session.parse({
    id: "SES-1",
    savedAt: "2026-08-19T10:00:00Z",
    status: "completed",
    device: {
      id: "DEV-1",
      name: "Router",
      operatingSystem: "OpenWrt",
      description: "desc",
      assets: [
        {
          id: "AS-1",
          name: "Asset 1",
          type: "network",
          description: "d",
          sensitive: false,
          requirements: ["ACM-1", "AUM-1-1"],
        },
        {
          id: "AS-2",
          name: "Asset 2",
          type: "security",
          description: "d",
          sensitive: true,
          requirements: ["ACM-1"],
        },
      ],
    },
    evaluations: [
      {
        assetId: "AS-1",
        requirementId: "ACM-1",
        status: "completed",
        outcome: "PASS",
        path: [{ nodeId: "n1", answer: "yes" }],
      },
      { assetId: "AS-1", requirementId: "AUM-1-1", status: "completed", outcome: "FAIL", path: [] },
      { assetId: "AS-2", requirementId: "ACM-1", status: "completed", outcome: "FAIL", path: [] },
    ],
  });
}

describe("buildReportData", () => {
  beforeEach(() => {
    vi.mocked(decisionTreeService.getTree).mockReset();
  });

  it("compone intestazione, riepilogo per requisito e dettaglio per asset", async () => {
    vi.mocked(decisionTreeService.getTree).mockImplementation(async (id: string) => {
      if (id === "ACM-1") return acmTree;
      throw new Error("not found");
    });

    const data = await buildReportData(session());

    expect(data.sessionId).toBe("SES-1");
    expect(data.sessionSavedAt).toBe("2026-08-19T10:00:00Z");
    expect(data.device).toMatchObject({
      name: "Router",
      operatingSystem: "OpenWrt",
      status: "FAIL",
    });

    const acm = data.requirementSummary.find((r) => r.requirementId === "ACM-1");
    expect(acm).toMatchObject({ requirementName: "Access control mechanism", status: "FAIL" });

    const as1 = data.assets.find((a) => a.assetId === "AS-1")!;
    const acmEntry = as1.requirements.find((r) => r.requirementId === "ACM-1")!;
    expect(acmEntry.pairStatus).toBe("PASS");
    expect(acmEntry.pathAvailable).toBe(true);
    expect(acmEntry.path).toEqual([{ nodeId: "n1", text: "Domanda 1?", answer: "yes" }]);
  });

  it("non si blocca se il fetch di un decision tree fallisce", async () => {
    vi.mocked(decisionTreeService.getTree).mockRejectedValue(new Error("network"));

    const data = await buildReportData(session());

    const summary = data.requirementSummary.find((r) => r.requirementId === "AUM-1-1")!;
    expect(summary.requirementName).toBe("AUM-1-1");

    const entry = data.assets
      .find((a) => a.assetId === "AS-1")!
      .requirements.find((r) => r.requirementId === "AUM-1-1")!;
    expect(entry.pathAvailable).toBe(false);
    expect(entry.path).toEqual([]);
  });
});
