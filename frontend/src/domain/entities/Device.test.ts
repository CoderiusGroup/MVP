import { describe, expect, it } from "vitest";

import { DeviceSchema } from "./Device";

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
