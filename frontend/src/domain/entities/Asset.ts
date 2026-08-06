import { z } from "zod";

export const AssetSchema = z.object({
  id: z.string(),
  deviceId: z.string(),
  name: z.string(),
});

export type Asset = z.infer<typeof AssetSchema>;
