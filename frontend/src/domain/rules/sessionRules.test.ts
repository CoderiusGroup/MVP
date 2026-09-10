import { describe, expect, it } from "vitest";

import { Asset } from "../entities/Asset";
import { Device } from "../entities/Device";
import { Session } from "../entities/Session";
import {
  getAssetStatus,
  getDeviceStatus,
  getEvaluationProgress,
  getEvaluationStatus,
  getRequirementStatus,
} from "./sessionRules";

function completedSession(): Session {
  return Session.parse({
    id: "SES-1",
    savedAt: "2026-08-19T10:00:00Z",
    status: "completed",
    device: {
      id: "DEV-1",
      name: "Device",
      operatingSystem: "OS",
      description: "desc",
      assets: [
        {
          id: "AS-1",
          name: "A1",
          type: "network",
          description: "d",
          sensitive: false,
          requirements: ["ACM-1", "ACM-2", "AUM-1-1"],
        },
        {
          id: "AS-2",
          name: "A2",
          type: "security",
          description: "d",
          sensitive: true,
          requirements: ["ACM-2"],
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
      { assetId: "AS-1", requirementId: "ACM-2", status: "completed", outcome: "FAIL", path: [] },
      { assetId: "AS-1", requirementId: "AUM-1-1", status: "completed", outcome: "PASS", path: [] },
      { assetId: "AS-2", requirementId: "ACM-2", status: "completed", outcome: "PASS", path: [] },
    ],
  });
}

describe("sessionRules — selezione valutazione", () => {
  it("Session.selectEvaluation sposta current senza alterare le valutazioni", () => {
    const session = completedSession();
    const result = session.selectEvaluation("AS-1", "AUM-1-1");

    expect(result.current).toEqual({ assetId: "AS-1", requirementId: "AUM-1-1", nodeId: "" });
    expect(result.status).toBe("in_progress");
    expect(result.evaluations).toEqual(session.evaluations);
  });
});

describe("sessionRules — stato di valutazione", () => {
  const requirementFreeAsset = Asset.create({
    id: "AS-3",
    name: "A3",
    type: "financial",
    description: "d",
    sensitive: false,
    requirements: [],
  });

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
    const asset = Asset.create({
      id: "AS-1",
      name: "A1",
      type: "network",
      description: "d",
      sensitive: false,
      requirements: ["ACM-1", "ACM-2", "AUM-1-1"],
    });

    expect(getAssetStatus(completedSession(), asset)).toBe("FAIL");
  });

  it("getAssetStatus ritorna PASS quando tutti i requisiti valutati sono PASS", () => {
    const asset = Asset.create({
      id: "AS-2",
      name: "A2",
      type: "security",
      description: "d",
      sensitive: true,
      requirements: ["ACM-2"],
    });

    expect(getAssetStatus(completedSession(), asset)).toBe("PASS");
  });

  it("getAssetStatus ritorna 'not_evaluated' se un requisito non ha ancora una valutazione", () => {
    const asset = Asset.create({
      id: "AS-2",
      name: "A2",
      type: "security",
      description: "d",
      sensitive: true,
      requirements: ["ACM-2", "AUM-1-2"],
    });

    expect(getAssetStatus(completedSession(), asset)).toBe("not_evaluated");
  });

  it("getEvaluationStatus ritorna 'in_progress' per una valutazione avviata ma non completata", () => {
    const session = completedSession().withEvaluations([
      { assetId: "AS-1", requirementId: "ACM-1", status: "in_progress", path: [] },
    ]);

    expect(getEvaluationStatus(session, "AS-1", "ACM-1")).toBe("in_progress");
  });

  it("getAssetStatus ritorna NOT_APPLICABLE solo se tutti i requisiti completati sono N/A", () => {
    const session = completedSession().withEvaluations([
      { assetId: "AS-1", requirementId: "ACM-1", status: "completed", outcome: "NOT_APPLICABLE" },
    ]);
    const asset = Asset.create({
      id: "AS-1",
      name: "A1",
      type: "network",
      description: "d",
      sensitive: false,
      requirements: ["ACM-1"],
    });

    expect(getAssetStatus(session, asset)).toBe("NOT_APPLICABLE");
  });

  it("getDeviceStatus riduce gli stati di tutti gli asset del device", () => {
    expect(getDeviceStatus(completedSession(), completedSession().device)).toBe("FAIL");
  });

  it("getRequirementStatus ritorna 'not_evaluated' senza sessione", () => {
    expect(getRequirementStatus(null, "ACM-1")).toBe("not_evaluated");
  });

  it("getRequirementStatus ritorna 'no_requirements' se nessun asset ha il requisito", () => {
    expect(getRequirementStatus(completedSession(), "AUM-2")).toBe("no_requirements");
  });

  it("getRequirementStatus aggrega l'esito del requisito su tutti gli asset che lo condividono", () => {
    expect(getRequirementStatus(completedSession(), "ACM-2")).toBe("FAIL");
    expect(getRequirementStatus(completedSession(), "ACM-1")).toBe("PASS");
    expect(getRequirementStatus(completedSession(), "AUM-1-1")).toBe("PASS");
  });

  it("getRequirementStatus ritorna 'not_evaluated' se una delle coppie non è ancora valutata", () => {
    const session = completedSession().withEvaluations([
      { assetId: "AS-1", requirementId: "ACM-2", status: "completed", outcome: "PASS", path: [] },
    ]);
    expect(getRequirementStatus(session, "ACM-2")).toBe("not_evaluated");
  });

  it("getDeviceStatus ritorna 'no_requirements' per un device senza asset", () => {
    const base = completedSession();
    const emptyDeviceSession = base.withDevice(base.device.withAssets([])).withEvaluations([]);

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
    const extraAsset = Asset.create({
      id: "AS-3",
      name: "A3",
      type: "financial",
      description: "d",
      sensitive: false,
      requirements: [],
    });
    const session = base.withDevice(base.device.withAssetAdded(extraAsset));

    expect(getEvaluationProgress(session)).toMatchObject({ assetsDone: 3, assetsTotal: 3 });
  });

  it("non conta un asset con requisiti ancora aperti", () => {
    const base = completedSession();
    const session = base.withEvaluations(
      base.evaluations.map((evaluation) =>
        evaluation.assetId === "AS-1" && evaluation.requirementId === "ACM-2"
          ? { assetId: evaluation.assetId, requirementId: evaluation.requirementId, status: "not_evaluated" }
          : evaluation,
      ),
    );

    expect(getEvaluationProgress(session, "AS-1")).toMatchObject({
      assetsDone: 1,
      reqDone: 2,
      reqTotal: 3,
    });
  });
});

describe("sessionRules — matchesPlan", () => {
  const deviceWith = (requirements: string[]): Device =>
    Device.create({
      id: "DEV-1",
      name: "Device",
      operatingSystem: "OS",
      description: "d",
      assets: [
        { id: "AS-1", name: "A1", type: "network", description: "d", sensitive: false, requirements },
      ],
    });

  const sessionWith = (requirements: string[]): Session =>
    Session.parse({
      id: "SES-1",
      savedAt: "2026-08-19T10:00:00Z",
      status: "in_progress",
      device: {
        id: "DEV-1",
        name: "Device",
        operatingSystem: "OS",
        description: "d",
        assets: [
          { id: "AS-1", name: "A1", type: "network", description: "d", sensitive: false, requirements },
        ],
      },
      evaluations: requirements.map((requirementId) => ({
        assetId: "AS-1",
        requirementId,
        status: "not_evaluated" as const,
      })),
    });

  it("vero quando le coppie coincidono con il piano del device", () => {
    expect(sessionWith(["ACM-1", "ACM-2"]).matchesPlan(deviceWith(["ACM-1", "ACM-2"]))).toBe(true);
  });

  it("falso quando un requisito è cambiato", () => {
    expect(sessionWith(["ACM-1", "ACM-2"]).matchesPlan(deviceWith(["ACM-1", "AUM-1-1"]))).toBe(
      false,
    );
  });

  it("falso quando il numero di coppie differisce", () => {
    expect(sessionWith(["ACM-1", "ACM-2"]).matchesPlan(deviceWith(["ACM-1"]))).toBe(false);
  });
});
