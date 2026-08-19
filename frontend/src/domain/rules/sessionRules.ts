import type { Device } from "../entities/Device";
import type { Evaluation, Session } from "../entities/Session";

export interface EvaluationPair {
  assetId: string;
  requirementId: string;
}

export type DependencyMap = Record<string, string[]>;

export function buildPlan(device: Device): EvaluationPair[] {
  const pairs: EvaluationPair[] = [];
  for (const asset of device.assets) {
    for (const requirementId of asset.requirements ?? []) {
      pairs.push({ assetId: asset.id, requirementId });
    }
  }
  return pairs;
}

export function isPairCompleted(evaluation: Evaluation): boolean {
  return evaluation.status === "completed";
}

export function transitiveDependents(
  requirementId: string,
  dependencies: DependencyMap,
): string[] {
  const dependents = new Set<string>();
  let changed = true;
  while (changed) {
    changed = false;
    for (const [requirement, deps] of Object.entries(dependencies)) {
      if (dependents.has(requirement) || requirement === requirementId) {
        continue;
      }
      if (deps.some((dep) => dep === requirementId || dependents.has(dep))) {
        dependents.add(requirement);
        changed = true;
      }
    }
  }
  return [...dependents];
}

export function selectEvaluation(
  session: Session,
  assetId: string,
  requirementId: string,
): Session {
  return {
    ...session,
    status: "in_progress",
    current: { assetId, requirementId, nodeId: "" },
  };
}

export function reopenEvaluation(
  session: Session,
  assetId: string,
  requirementId: string,
  dependentRequirementIds: string[],
): Session {
  const toReset = new Set([requirementId, ...dependentRequirementIds]);
  return {
    ...session,
    status: "in_progress",
    current: { assetId, requirementId, nodeId: "" },
    evaluations: session.evaluations.map((evaluation): Evaluation =>
      evaluation.assetId === assetId && toReset.has(evaluation.requirementId)
        ? {
            assetId: evaluation.assetId,
            requirementId: evaluation.requirementId,
            status: "not_evaluated",
          }
        : evaluation,
    ),
  };
}

export function createInitialSession(
  device: Device,
  id: string,
  savedAt: string,
): Session {
  const plan = buildPlan(device);
  const evaluations: Evaluation[] = plan.map((pair) => ({
    assetId: pair.assetId,
    requirementId: pair.requirementId,
    status: "not_evaluated",
  }));

  const first = plan[0];
  return {
    id,
    savedAt,
    status: first ? "in_progress" : "completed",
    device,
    evaluations,
    current: first
      ? { assetId: first.assetId, requirementId: first.requirementId, nodeId: "" }
      : undefined,
  };
}
