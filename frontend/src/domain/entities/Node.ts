import { z } from "zod";

const QuestionNodeSchema = z.object({
  kind: z.literal("question"),
  id: z.string(),
  text: z.string(),
  onYes: z.string(),
  onNo: z.string(),
});

const LeafNodeSchema = z.object({
  kind: z.literal("leaf"),
  id: z.string(),
  result: z.enum(["PASS", "FAIL", "NOT_APPLICABLE"]),
});

export const NodeSchema = z.discriminatedUnion("kind", [
  QuestionNodeSchema,
  LeafNodeSchema,
]);

export type Node = z.infer<typeof NodeSchema>;
