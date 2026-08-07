import { z } from "zod";

import { AssetSchema } from "./Asset";

const identifier = z.string().min(1).max(64);

export const DeviceSchema = z.object({
  id: identifier,
  name: z.string().min(1).max(100),
  operatingSystem: z.string().min(1).max(100),
  description: z.string().min(1).max(1000),
  assets: z.array(AssetSchema),
});

export type Device = z.infer<typeof DeviceSchema>;
