import { describe, expect, it } from "vitest";

import { DeviceSchema } from "./Device";

describe("DeviceSchema", () => {
  it("accepts a valid device", () => {
    const result = DeviceSchema.safeParse({
      id: "d1",
      name: "Router",
      operatingSystem: "Linux",
      description: "Router principale",
      assets: [],
    });

    expect(result.success).toBe(true);
  });

  it("rejects a device missing required fields", () => {
    const result = DeviceSchema.safeParse({ id: "d1" });

    expect(result.success).toBe(false);
  });
});
