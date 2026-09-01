import type { Session } from "../domain/entities/Session";
import { describePath, type PathQuestion } from "../domain/rules/treeRules";
import {
  getAssetStatus,
  getDeviceStatus,
  getEvaluationStatus,
  getRequirementStatus,
  type DisplayStatus,
} from "../domain/rules/sessionRules";
import { decisionTreeService } from "./DecisionTreeService";

export interface ReportRequirementEntry {
  requirementId: string;
  requirementName: string;
  pairStatus: DisplayStatus;
  path: PathQuestion[];
  pathAvailable: boolean;
}

export interface ReportAssetEntry {
  assetId: string;
  name: string;
  type: string;
  status: DisplayStatus;
  requirements: ReportRequirementEntry[];
}

export interface ReportRequirementSummary {
  requirementId: string;
  requirementName: string;
  status: DisplayStatus;
}

export interface ReportData {
  generatedAt: string;
  sessionId: string;
  sessionSavedAt: string;
  device: {
    name: string;
    operatingSystem: string;
    description: string;
    status: DisplayStatus;
  };
  requirementSummary: ReportRequirementSummary[];
  assets: ReportAssetEntry[];
}

export async function buildReportData(session: Session): Promise<ReportData> {
  const requirementIds = [
    ...new Set(session.evaluations.map((evaluation) => evaluation.requirementId)),
  ];

  const trees = await Promise.all(
    requirementIds.map((id) => decisionTreeService.getTree(id).catch(() => null)),
  );
  const treeById = new Map(requirementIds.map((id, index) => [id, trees[index]] as const));
  const nameOf = (requirementId: string) =>
    treeById.get(requirementId)?.requirementName ?? requirementId;

  const assets: ReportAssetEntry[] = session.device.assets.map((asset) => ({
    assetId: asset.id,
    name: asset.name,
    type: asset.type,
    status: getAssetStatus(session, asset),
    requirements: (asset.requirements ?? []).map((requirementId): ReportRequirementEntry => {
      const tree = treeById.get(requirementId) ?? null;
      const steps =
        session.evaluations.find(
          (evaluation) =>
            evaluation.assetId === asset.id && evaluation.requirementId === requirementId,
        )?.path ?? [];
      return {
        requirementId,
        requirementName: nameOf(requirementId),
        pairStatus: getEvaluationStatus(session, asset.id, requirementId),
        path: tree ? describePath(tree, steps) : [],
        pathAvailable: tree !== null,
      };
    }),
  }));

  const requirementSummary: ReportRequirementSummary[] = requirementIds.map((requirementId) => ({
    requirementId,
    requirementName: nameOf(requirementId),
    status: getRequirementStatus(session, requirementId),
  }));

  return {
    generatedAt: new Date().toISOString(),
    sessionId: session.id,
    sessionSavedAt: session.savedAt,
    device: {
      name: session.device.name,
      operatingSystem: session.device.operatingSystem,
      description: session.device.description,
      status: getDeviceStatus(session, session.device),
    },
    requirementSummary,
    assets,
  };
}
