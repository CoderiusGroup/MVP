import { z } from "zod";

import { Device, DeviceSchema } from "./Device";

const identifier = z.string().min(1).max(64);
const requirementCode = z.string().regex(/^[A-Z]{2,4}(-[A-Za-z0-9]+)+$/);
const nodeCode = z.string().min(1).max(32);

const PathStepSchema = z.object({
  nodeId: nodeCode,
  answer: z.enum(["yes", "no"]),
});

const EvaluationSchema = z.object({
  assetId: identifier,
  requirementId: requirementCode,
  status: z.enum(["not_evaluated", "in_progress", "completed"]),
  outcome: z.enum(["PASS", "FAIL", "NOT_APPLICABLE"]).optional(),
  justification: z.string().max(2000).optional(),
  path: z.array(PathStepSchema).optional(),
});

const CurrentSchema = z.object({
  assetId: identifier,
  requirementId: requirementCode,
  // Niente min(1) come nodeCode: Session.selectEvaluation()/reopenEvaluation()
  // costruiscono legittimamente un nodeId vuoto ("non ancora risolto", lo
  // risolve il TreeStore all'idratazione dell'albero).
  nodeId: z.string().max(32),
});

export const SessionSchema = z.object({
  id: identifier,
  savedAt: z.string(),
  status: z.enum(["in_progress", "completed"]),
  device: DeviceSchema,
  decisionTreeVersions: z.record(requirementCode, z.string()).optional(),
  current: CurrentSchema.optional(),
  evaluations: z.array(EvaluationSchema),
});

// Evaluation/Current/PathStep restano dati puri (nessun comportamento proprio,
// nessun invariante da proteggere oltre alla forma) — non diventano classi:
// solo Session ha comportamento reale da incapsulare.
export type Evaluation = z.infer<typeof EvaluationSchema>;
export type Current = z.infer<typeof CurrentSchema>;
export type PathStep = z.infer<typeof PathStepSchema>;
export type SessionStatus = z.infer<typeof SessionSchema>["status"];

type SessionRaw = z.infer<typeof SessionSchema>;

function deviceFromRaw(raw: SessionRaw["device"]): Device {
  return Device.create(raw);
}

export class Session {
  readonly #id: string;
  readonly #savedAt: string;
  readonly #status: SessionStatus;
  readonly #device: Device;
  readonly #decisionTreeVersions: Record<string, string> | undefined;
  readonly #current: Current | undefined;
  readonly #evaluations: Evaluation[];

  constructor(
    id: string,
    savedAt: string,
    status: SessionStatus,
    device: Device,
    evaluations: Evaluation[],
    options: { decisionTreeVersions?: Record<string, string>; current?: Current } = {},
  ) {
    this.#id = id;
    this.#savedAt = savedAt;
    this.#status = status;
    this.#device = device;
    this.#evaluations = evaluations;
    this.#decisionTreeVersions = options.decisionTreeVersions;
    this.#current = options.current;
  }

  get id(): string {
    return this.#id;
  }

  get savedAt(): string {
    return this.#savedAt;
  }

  get status(): SessionStatus {
    return this.#status;
  }

  get device(): Device {
    return this.#device;
  }

  get decisionTreeVersions(): Record<string, string> | undefined {
    return this.#decisionTreeVersions;
  }

  get current(): Current | undefined {
    return this.#current;
  }

  get evaluations(): Evaluation[] {
    return this.#evaluations;
  }

  withSavedAt(savedAt: string): Session {
    return new Session(this.#id, savedAt, this.#status, this.#device, this.#evaluations, {
      decisionTreeVersions: this.#decisionTreeVersions,
      current: this.#current,
    });
  }

  // UC-19: attiva la coppia asset/requisito e apre l'albero da capo (nodeId
  // vuoto: lo risolve il TreeStore all'idratazione).
  selectEvaluation(assetId: string, requirementId: string): Session {
    return new Session(this.#id, this.#savedAt, "in_progress", this.#device, this.#evaluations, {
      decisionTreeVersions: this.#decisionTreeVersions,
      current: { assetId, requirementId, nodeId: "" },
    });
  }

  // UC-27.2: riapre una coppia già valutata e tutte quelle che ne dipendono
  // transitivamente, riportandole a "non_valutato".
  reopenEvaluation(
    assetId: string,
    requirementId: string,
    dependentRequirementIds: string[],
  ): Session {
    const toReset = new Set([requirementId, ...dependentRequirementIds]);
    const evaluations = this.#evaluations.map((evaluation): Evaluation =>
      evaluation.assetId === assetId && toReset.has(evaluation.requirementId)
        ? { assetId: evaluation.assetId, requirementId: evaluation.requirementId, status: "not_evaluated" }
        : evaluation,
    );
    return new Session(this.#id, this.#savedAt, "in_progress", this.#device, evaluations, {
      decisionTreeVersions: this.#decisionTreeVersions,
      current: { assetId, requirementId, nodeId: "" },
    });
  }

  // Registra il nodo corrente e il percorso parziale mentre l'utente percorre
  // l'albero, senza chiudere la valutazione (status resta "in_progress").
  syncProgress(nodeId: string, path: PathStep[]): Session {
    if (!this.#current) {
      return this;
    }
    const { assetId, requirementId } = this.#current;
    const evaluations = this.#evaluations.map((evaluation) =>
      evaluation.assetId === assetId &&
      evaluation.requirementId === requirementId &&
      evaluation.status !== "completed"
        ? { ...evaluation, status: "in_progress" as const, path }
        : evaluation,
    );
    return new Session(
      this.#id,
      this.#savedAt,
      this.#status,
      this.#device,
      evaluations,
      { decisionTreeVersions: this.#decisionTreeVersions, current: { ...this.#current, nodeId } },
    );
  }

  // UC-23: registra l'esito raggiunto per la coppia corrente; la sessione
  // passa a "completed" quando tutte le valutazioni lo sono.
  completeCurrent(outcome: Evaluation["outcome"], path: PathStep[]): Session {
    if (!this.#current) {
      return this;
    }
    const { assetId, requirementId } = this.#current;
    const evaluations = this.#evaluations.map((evaluation) =>
      evaluation.assetId === assetId && evaluation.requirementId === requirementId
        ? { ...evaluation, status: "completed" as const, outcome, path }
        : evaluation,
    );
    const allCompleted = evaluations.every((evaluation) => evaluation.status === "completed");
    return new Session(
      this.#id,
      this.#savedAt,
      allCompleted ? "completed" : this.#status,
      this.#device,
      evaluations,
      { decisionTreeVersions: this.#decisionTreeVersions, current: this.#current },
    );
  }

  // UC-26: vera se le valutazioni coprono esattamente il piano attuale del
  // device (stesse coppie asset-requisito) — in tal caso la sessione resta
  // riprendibile così com'è, invece di doverne avviare una nuova.
  matchesPlan(device: Device): boolean {
    const plan = device.buildPlan();
    if (plan.length !== this.#evaluations.length) {
      return false;
    }
    return plan.every((pair) =>
      this.#evaluations.some(
        (evaluation) =>
          evaluation.assetId === pair.assetId && evaluation.requirementId === pair.requirementId,
      ),
    );
  }

  withEvaluations(evaluations: Evaluation[]): Session {
    return new Session(this.#id, this.#savedAt, this.#status, this.#device, evaluations, {
      decisionTreeVersions: this.#decisionTreeVersions,
      current: this.#current,
    });
  }

  withDevice(device: Device): Session {
    return new Session(this.#id, this.#savedAt, this.#status, device, this.#evaluations, {
      decisionTreeVersions: this.#decisionTreeVersions,
      current: this.#current,
    });
  }

  toJSON() {
    return {
      id: this.id,
      savedAt: this.savedAt,
      status: this.status,
      device: this.device.toJSON(),
      decisionTreeVersions: this.decisionTreeVersions,
      current: this.current,
      evaluations: this.evaluations,
    };
  }

  // Avvia una sessione nuova per un device: una coppia asset/requisito per
  // ogni requisito derivato di ogni asset, tutte "non_valutato".
  static start(device: Device, id: string, savedAt: string): Session {
    const plan = device.buildPlan();
    const evaluations: Evaluation[] = plan.map((pair) => ({
      assetId: pair.assetId,
      requirementId: pair.requirementId,
      status: "not_evaluated",
    }));
    const first = plan[0];
    return new Session(
      id,
      savedAt,
      first ? "in_progress" : "completed",
      device,
      evaluations,
      first ? { current: { assetId: first.assetId, requirementId: first.requirementId, nodeId: "" } } : {},
    );
  }

  // Valida e ricostruisce una sessione da un file caricato dall'utente.
  static parse(raw: unknown): Session {
    const parsed = SessionSchema.parse(raw);
    return new Session(
      parsed.id,
      parsed.savedAt,
      parsed.status,
      deviceFromRaw(parsed.device),
      parsed.evaluations,
      { decisionTreeVersions: parsed.decisionTreeVersions, current: parsed.current },
    );
  }
}
