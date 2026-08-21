import { describe, expect, it } from "vitest";

import type { Session } from "../entities/Session";
import {
  reopenEvaluation,
  selectEvaluation,
  transitiveDependents,
  type DependencyMap,
} from "./sessionRules";

const dependencies: DependencyMap = {
  "ACM-1": [],
  "ACM-2": ["ACM-1"],
  "AUM-1-1": ["ACM-1"],
  "AUM-1-2": ["ACM-1"],
  "AUM-2": ["AUM-1-1", "AUM-1-2"],
};

function completedSession(): Session {
  return {
    id: "SES-1",
    savedAt: "2026-08-19T10:00:00Z",
    status: "completed",
    device: {
      id: "DEV-1",
      name: "Device",
      operatingSystem: "OS",
      description: "desc",
      assets: [
        { id: "AS-1", name: "A1", type: "network", description: "d", sensitive: false, requirements: ["ACM-1", "ACM-2", "AUM-1-1"] },
        { id: "AS-2", name: "A2", type: "security", description: "d", sensitive: true, requirements: ["ACM-2"] },
      ],
    },
    evaluations: [
      { assetId: "AS-1", requirementId: "ACM-1", status: "completed", outcome: "PASS", path: [{ nodeId: "n1", answer: "yes" }] },
      { assetId: "AS-1", requirementId: "ACM-2", status: "completed", outcome: "FAIL", path: [] },
      { assetId: "AS-1", requirementId: "AUM-1-1", status: "completed", outcome: "PASS", path: [] },
      { assetId: "AS-2", requirementId: "ACM-2", status: "completed", outcome: "PASS", path: [] },
    ],
    current: undefined,
  };
}

describe("sessionRules — dipendenze e riapertura", () => {
  it("transitiveDependents raccoglie i dipendenti diretti e transitivi", () => {
    expect(new Set(transitiveDependents("ACM-1", dependencies))).toEqual(
      new Set(["ACM-2", "AUM-1-1", "AUM-1-2", "AUM-2"]),
    );
  });

  it("transitiveDependents segue solo la catena a valle", () => {
    expect(transitiveDependents("AUM-1-1", dependencies)).toEqual(["AUM-2"]);
    expect(transitiveDependents("AUM-2", dependencies)).toEqual([]);
  });

  it("reopenEvaluation azzera il requisito e i suoi dipendenti sullo stesso asset", () => {
    const result = reopenEvaluation(completedSession(), "AS-1", "ACM-1", ["ACM-2", "AUM-1-1"]);

    const as1 = (req: string) =>
      result.evaluations.find((e) => e.assetId === "AS-1" && e.requirementId === req);
    expect(as1("ACM-1")).toMatchObject({ status: "not_evaluated" });
    expect(as1("ACM-1")?.outcome).toBeUndefined();
    expect(as1("ACM-1")?.path).toBeUndefined();
    expect(as1("ACM-2")).toMatchObject({ status: "not_evaluated" });
    expect(as1("AUM-1-1")).toMatchObject({ status: "not_evaluated" });

    expect(result.status).toBe("in_progress");
    expect(result.current).toEqual({ assetId: "AS-1", requirementId: "ACM-1", nodeId: "" });
  });

  it("reopenEvaluation non tocca lo stesso requisito su un altro asset", () => {
    const result = reopenEvaluation(completedSession(), "AS-1", "ACM-1", ["ACM-2"]);
    const as2 = result.evaluations.find((e) => e.assetId === "AS-2" && e.requirementId === "ACM-2");
    expect(as2).toMatchObject({ status: "completed", outcome: "PASS" });
  });

  it("selectEvaluation sposta current senza alterare le valutazioni", () => {
    const session = completedSession();
    const result = selectEvaluation(session, "AS-1", "AUM-1-1");

    expect(result.current).toEqual({ assetId: "AS-1", requirementId: "AUM-1-1", nodeId: "" });
    expect(result.status).toBe("in_progress");
    expect(result.evaluations).toEqual(session.evaluations);
  });
});
