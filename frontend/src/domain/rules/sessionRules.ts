import type { Asset } from "../entities/Asset";
import type { Device } from "../entities/Device";
import type { Evaluation, Session } from "../entities/Session";

export interface EvaluationProgress {
  assetsDone: number;
  assetsTotal: number;
  reqDone: number;
  reqTotal: number;
}

function assetRequirementsDone(session: Session, asset: Asset): number {
  return (asset.requirements ?? []).filter((requirementId) =>
    session.evaluations.some(
      (evaluation) =>
        evaluation.assetId === asset.id &&
        evaluation.requirementId === requirementId &&
        evaluation.status === "completed",
    ),
  ).length;
}

export function getEvaluationProgress(session: Session, assetId?: string): EvaluationProgress {
  const assets = session.device.assets;
  const assetsDone = assets.filter((asset) => {
    const total = (asset.requirements ?? []).length;
    return total === 0 || assetRequirementsDone(session, asset) === total;
  }).length;

  const current = assetId ? assets.find((asset) => asset.id === assetId) : undefined;
  return {
    assetsDone,
    assetsTotal: assets.length,
    reqDone: current ? assetRequirementsDone(session, current) : 0,
    reqTotal: current ? (current.requirements ?? []).length : 0,
  };
}

export type DisplayStatus =
  | "FAIL"
  | "in_progress"
  | "not_evaluated"
  | "PASS"
  | "NOT_APPLICABLE"
  | "no_requirements";

export const STATUS_LABELS: Record<DisplayStatus, string> = {
  FAIL: "FAIL",
  in_progress: "In corso",
  not_evaluated: "Non valutato",
  PASS: "PASS",
  NOT_APPLICABLE: "Non applicabile",
  no_requirements: "Nessun requisito applicabile",
};

const STATUS_PRIORITY: DisplayStatus[] = [
  "FAIL",
  "in_progress",
  "not_evaluated",
  "PASS",
  "NOT_APPLICABLE",
  "no_requirements",
];

function statusOf(evaluation: Evaluation): DisplayStatus {
  if (evaluation.status !== "completed") {
    return evaluation.status;
  }
  return evaluation.outcome ?? "NOT_APPLICABLE";
}

function reduceStatuses(statuses: DisplayStatus[]): DisplayStatus {
  if (statuses.length === 0) {
    return "no_requirements";
  }
  return STATUS_PRIORITY.find((candidate) => statuses.includes(candidate)) ?? "no_requirements";
}

export function getEvaluationStatus(
  session: Session | null,
  assetId: string,
  requirementId: string,
): DisplayStatus {
  if (!session) {
    return "not_evaluated";
  }
  const evaluation = session.evaluations.find(
    (e) => e.assetId === assetId && e.requirementId === requirementId,
  );
  return evaluation ? statusOf(evaluation) : "not_evaluated";
}

export function getAssetStatus(session: Session | null, asset: Asset): DisplayStatus {
  const requirementIds = asset.requirements ?? [];
  if (requirementIds.length === 0) {
    return "no_requirements";
  }
  return reduceStatuses(
    requirementIds.map((requirementId) => getEvaluationStatus(session, asset.id, requirementId)),
  );
}

export function getDeviceStatus(session: Session | null, device: Device): DisplayStatus {
  return reduceStatuses(device.assets.map((asset) => getAssetStatus(session, asset)));
}

export function getRequirementStatus(
  session: Session | null,
  requirementId: string,
): DisplayStatus {
  if (!session) {
    return "not_evaluated";
  }
  const assetIds = session.device.assets
    .filter((asset) => (asset.requirements ?? []).includes(requirementId))
    .map((asset) => asset.id);
  if (assetIds.length === 0) {
    return "no_requirements";
  }
  return reduceStatuses(
    assetIds.map((assetId) => getEvaluationStatus(session, assetId, requirementId)),
  );
}
