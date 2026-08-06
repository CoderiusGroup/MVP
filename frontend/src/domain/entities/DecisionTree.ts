import { z } from "zod";

import { NodeSchema } from "./Node";

export const DecisionTreeSchema = z.object({
  id: z.string(),
  name: z.string(),
  rootNodeId: z.string(),
  nodes: z.array(NodeSchema),
});

export type DecisionTree = z.infer<typeof DecisionTreeSchema>;
