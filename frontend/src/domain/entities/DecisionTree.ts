import { z } from "zod";

import { NodeSchema } from "./Node";

const requirementCode = z.string().regex(/^[A-Z]{2,4}(-[A-Za-z0-9]+)+$/);

export const DecisionTreeSchema = z.object({
  requirementId: requirementCode,
  requirementName: z.string().min(1).max(200),
  version: z.string().regex(/^[0-9]+\.[0-9]+\.[0-9]+$/).optional(),
  appliesTo: z.array(z.enum(["network", "security", "privacy", "financial"])).optional(),
  dependencies: z.array(requirementCode).optional(),
  rootNode: z.string().min(1).max(32),
  nodes: z.array(NodeSchema),
  message: z.string().optional(),
});

export type DecisionTree = z.infer<typeof DecisionTreeSchema>;
