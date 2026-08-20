import { describe, expect, it } from "vitest";

import { AssetSchema, AssetCreateSchema } from "./Asset";

describe("AssetSchema", () => {
  it("accepts a valid asset", () => {
    const result = AssetSchema.safeParse({
      id: "AS-01",
      name: "Interfaccia di rete Wi-Fi",
      type: "network",
      description: "Interfaccia radio 802.11.",
      sensitive: false,
      requirements: ["ACM-1"],
    });

    expect(result.success).toBe(true);
  });

  it("accepts an asset without requirements", () => {
    const result = AssetSchema.safeParse({
      id: "AS-01",
      name: "Interfaccia di rete Wi-Fi",
      type: "network",
      description: "Interfaccia radio 802.11.",
      sensitive: false,
    });

    expect(result.success).toBe(true);
  });

  it("rejects an asset missing required fields", () => {
    const result = AssetSchema.safeParse({ id: "AS-01" });

    expect(result.success).toBe(false);
  });

  it("rejects an asset with an invalid type", () => {
    const result = AssetSchema.safeParse({
      id: "AS-01",
      name: "Interfaccia di rete Wi-Fi",
      type: "unknown",
      description: "Interfaccia radio 802.11.",
      sensitive: false,
    });

    expect(result.success).toBe(false);
  });
});

describe("AssetCreateSchema", () => {
  it("accepts a valid creation payload without an id", () => {
    const result = AssetCreateSchema.safeParse({
      name: "Interfaccia di rete Wi-Fi",
      type: "network",
      description: "Interfaccia radio 802.11.",
      sensitive: false,
    });

    expect(result.success).toBe(true);
  });

  it("rejects a payload missing sensitive", () => {
    const result = AssetCreateSchema.safeParse({
      name: "Interfaccia di rete Wi-Fi",
      type: "network",
      description: "Interfaccia radio 802.11.",
    });

    expect(result.success).toBe(false);
  });
});
