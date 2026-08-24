import { describe, expect, it } from "vitest";

import type { Asset } from "../entities/Asset";
import type { Device } from "../entities/Device";
import type { Session } from "../entities/Session";
import {
  getAssetStatus,
  getDeviceStatus,
  getEvaluationProgress,
  getEvaluationStatus,
  matchesPlan,
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

describe("sessionRules — stato di valutazione", () => {
  const requirementFreeAsset: Asset = {
    id: "AS-3",
    name: "A3",
    type: "financial",
    description: "d",
    sensitive: false,
    requirements: [],
  };

  it("getEvaluationStatus ritorna 'not_evaluated' senza sessione", () => {
    expect(getEvaluationStatus(null, "AS-1", "ACM-1")).toBe("not_evaluated");
  });

  it("getEvaluationStatus ritorna l'outcome per una valutazione completata", () => {
    expect(getEvaluationStatus(completedSession(), "AS-1", "ACM-1")).toBe("PASS");
    expect(getEvaluationStatus(completedSession(), "AS-1", "ACM-2")).toBe("FAIL");
  });

  it("getEvaluationStatus ritorna 'not_evaluated' per una coppia senza valutazione", () => {
    expect(getEvaluationStatus(completedSession(), "AS-1", "AUM-2")).toBe("not_evaluated");
  });

  it("getAssetStatus ritorna 'no_requirements' per un asset senza requisiti", () => {
    expect(getAssetStatus(completedSession(), requirementFreeAsset)).toBe("no_requirements");
    expect(getAssetStatus(null, requirementFreeAsset)).toBe("no_requirements");
  });

  it("getAssetStatus da priorità a FAIL su un asset con esiti misti", () => {
    const asset: Asset = {
      id: "AS-1",
      name: "A1",
      type: "network",
      description: "d",
      sensitive: false,
      requirements: ["ACM-1", "ACM-2", "AUM-1-1"],
    };

    expect(getAssetStatus(completedSession(), asset)).toBe("FAIL");
  });

  it("getAssetStatus ritorna PASS quando tutti i requisiti valutati sono PASS", () => {
    const asset: Asset = {
      id: "AS-2",
      name: "A2",
      type: "security",
      description: "d",
      sensitive: true,
      requirements: ["ACM-2"],
    };

    expect(getAssetStatus(completedSession(), asset)).toBe("PASS");
  });

  it("getAssetStatus ritorna 'not_evaluated' se un requisito non ha ancora una valutazione", () => {
    const asset: Asset = {
      id: "AS-2",
      name: "A2",
      type: "security",
      description: "d",
      sensitive: true,
      requirements: ["ACM-2", "AUM-1-2"],
    };

    expect(getAssetStatus(completedSession(), asset)).toBe("not_evaluated");
  });

  it("getEvaluationStatus ritorna 'in_progress' per una valutazione avviata ma non completata", () => {
    const session: Session = {
      ...completedSession(),
      evaluations: [
        { assetId: "AS-1", requirementId: "ACM-1", status: "in_progress", path: [] },
      ],
    };

    expect(getEvaluationStatus(session, "AS-1", "ACM-1")).toBe("in_progress");
  });

  it("getAssetStatus ritorna NOT_APPLICABLE solo se tutti i requisiti completati sono N/A", () => {
    const session: Session = {
      ...completedSession(),
      evaluations: [
        { assetId: "AS-1", requirementId: "ACM-1", status: "completed", outcome: "NOT_APPLICABLE" },
      ],
    };
    const asset: Asset = {
      id: "AS-1",
      name: "A1",
      type: "network",
      description: "d",
      sensitive: false,
      requirements: ["ACM-1"],
    };

    expect(getAssetStatus(session, asset)).toBe("NOT_APPLICABLE");
  });

  it("getDeviceStatus riduce gli stati di tutti gli asset del device", () => {
    expect(getDeviceStatus(completedSession(), completedSession().device)).toBe("FAIL");
  });

  it("getDeviceStatus ritorna 'no_requirements' per un device senza asset", () => {
    const emptyDeviceSession: Session = {
      ...completedSession(),
      device: { ...completedSession().device, assets: [] },
      evaluations: [],
    };

    expect(getDeviceStatus(emptyDeviceSession, emptyDeviceSession.device)).toBe(
      "no_requirements",
    );
  });
});

describe("sessionRules — getEvaluationProgress", () => {
  it("conta gli asset completati sul totale e i requisiti dell'asset indicato", () => {
    expect(getEvaluationProgress(completedSession(), "AS-1")).toEqual({
      assetsDone: 2,
      assetsTotal: 2,
      reqDone: 3,
      reqTotal: 3,
    });
  });

  it("considera completato un asset senza requisiti", () => {
    const base = completedSession();
    const session: Session = {
      ...base,
      device: {
        ...base.device,
        assets: [
          ...base.device.assets,
          { id: "AS-3", name: "A3", type: "financial", description: "d", sensitive: false, requirements: [] },
        ],
      },
    };

    expect(getEvaluationProgress(session)).toMatchObject({ assetsDone: 3, assetsTotal: 3 });
  });

  it("non conta un asset con requisiti ancora aperti", () => {
    const base = completedSession();
    const session: Session = {
      ...base,
      evaluations: base.evaluations.map((evaluation) =>
        evaluation.assetId === "AS-1" && evaluation.requirementId === "ACM-2"
          ? { assetId: evaluation.assetId, requirementId: evaluation.requirementId, status: "not_evaluated" }
          : evaluation,
      ),
    };

    expect(getEvaluationProgress(session, "AS-1")).toMatchObject({
      assetsDone: 1,
      reqDone: 2,
      reqTotal: 3,
    });
  });
});

describe("sessionRules — matchesPlan", () => {
  const deviceWith = (requirements: string[]): Device => ({
    id: "DEV-1",
    name: "Device",
    operatingSystem: "OS",
    description: "d",
    assets: [
      { id: "AS-1", name: "A1", type: "network", description: "d", sensitive: false, requirements },
    ],
  });

  const sessionWith = (requirements: string[]): Session => ({
    id: "SES-1",
    savedAt: "2026-08-19T10:00:00Z",
    status: "in_progress",
    device: deviceWith(requirements),
    evaluations: requirements.map((requirementId) => ({
      assetId: "AS-1",
      requirementId,
      status: "not_evaluated" as const,
    })),
    current: undefined,
  });

  it("vero quando le coppie coincidono con il piano del device", () => {
    expect(matchesPlan(sessionWith(["ACM-1", "ACM-2"]), deviceWith(["ACM-1", "ACM-2"]))).toBe(true);
  });

  it("falso quando un requisito è cambiato", () => {
    expect(matchesPlan(sessionWith(["ACM-1", "ACM-2"]), deviceWith(["ACM-1", "AUM-1-1"]))).toBe(false);
  });

  it("falso quando il numero di coppie differisce", () => {
    expect(matchesPlan(sessionWith(["ACM-1", "ACM-2"]), deviceWith(["ACM-1"]))).toBe(false);
  });
});
