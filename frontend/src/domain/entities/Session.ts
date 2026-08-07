import { z } from "zod";

import { DeviceSchema } from "./Device";

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
  nodeId: nodeCode,
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

export type Session = z.infer<typeof SessionSchema>;
export type Evaluation = z.infer<typeof EvaluationSchema>;
export type PathStep = z.infer<typeof PathStepSchema>;
