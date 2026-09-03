import { describe, expect, it } from "vitest";

import { Device, DeviceSchema } from "./Device";

describe("Device.buildPlan", () => {
  it("enumerates assets then their requirements in order", () => {
    const device = Device.create({
      id: "DEV-1",
      name: "Device",
      operatingSystem: "OS",
      description: "desc",
      assets: [
        {
          id: "AS-1",
          name: "Asset 1",
          type: "network",
          description: "d",
          sensitive: false,
          requirements: ["ACM-1", "ACM-2"],
        },
        {
          id: "AS-2",
          name: "Asset 2",
          type: "security",
          description: "d",
          sensitive: true,
          requirements: ["AUM-1-1"],
        },
      ],
    });

    expect(device.buildPlan()).toEqual([
      { assetId: "AS-1", requirementId: "ACM-1" },
      { assetId: "AS-1", requirementId: "ACM-2" },
      { assetId: "AS-2", requirementId: "AUM-1-1" },
    ]);
  });
});

describe("DeviceSchema", () => {
  it("accepts a valid device", () => {
    const result = DeviceSchema.safeParse({
      id: "DEV-SL200",
      name: "Smart Lock SL-200",
      operatingSystem: "Zephyr RTOS 3.5",
      description: "Serratura elettronica connessa tramite Wi-Fi e BLE.",
      assets: [
        {
          id: "AS-01",
          name: "Interfaccia di rete Wi-Fi",
          type: "network",
          description: "Interfaccia radio 802.11.",
          sensitive: false,
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("rejects a device missing required fields", () => {
    const result = DeviceSchema.safeParse({ id: "DEV-SL200" });

    expect(result.success).toBe(false);
  });
});
