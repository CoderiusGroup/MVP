import { z } from "zod";

export const DeviceSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export type Device = z.infer<typeof DeviceSchema>;
