import { z } from "zod";

const identifier = z.string().min(1).max(64);
const requirementCode = z.string().regex(/^[A-Z]{2,4}(-[A-Za-z0-9]+)+$/);

export const AssetSchema = z.object({
  id: identifier,
  name: z.string().min(1).max(100),
  type: z.enum(["network", "security", "privacy", "financial"]),
  description: z.string().min(1).max(1000),
  sensitive: z.boolean(),
  requirements: z.array(requirementCode).optional(),
});

export const AssetCreateSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(["network", "security", "privacy", "financial"]),
  description: z.string().min(1).max(1000),
  sensitive: z.boolean(),
  requirements: z.array(requirementCode).optional(),
});

export type Asset = z.infer<typeof AssetSchema>;

export type AssetCreate = z.infer<typeof AssetCreateSchema>;
