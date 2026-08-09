import z  from "zod";

export const DeviceSchema = z.object({
  id: z.string(),
  name: z.string(),
  OperatingSystem: z.string(),
  description: z.string(),
});

export const DeviceCreateSchema = z.object({
  name: z.string().min(1),
  OperatingSystem: z.string().optional().default(""),
  description: z.string().optional().default(""),
});

export type Device = z.infer<typeof DeviceSchema>;

export type DeviceCreate = z.infer<typeof DeviceCreateSchema>;