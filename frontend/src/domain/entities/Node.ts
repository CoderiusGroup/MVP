import { z } from "zod";

const nodeCode = z.string().min(1).max(32);

const BranchesSchema = z.object({
  yes: nodeCode,
  no: nodeCode,
});

const QuestionNodeSchema = z.object({
  id: nodeCode,
  type: z.literal("question"),
  text: z.string().min(1).max(1000),
  branches: BranchesSchema,
});

const LeafNodeSchema = z.object({
  id: nodeCode,
  type: z.literal("leaf"),
  outcome: z.enum(["PASS", "FAIL", "NOT_APPLICABLE"]),
  text: z.string().max(1000).optional(),
});

export const NodeSchema = z.discriminatedUnion("type", [
  QuestionNodeSchema,
  LeafNodeSchema,
]);

export type Node = z.infer<typeof NodeSchema>;
