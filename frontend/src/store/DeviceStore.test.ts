import { beforeEach, describe, expect, it } from "vitest";

import type { Asset } from "../domain/entities/Asset";
import type { Device } from "../domain/entities/Device";
import { useDeviceStore } from "./DeviceStore";

const sampleDevice: Device = {
  id: "DEV-1",
  name: "Router1",
  operatingSystem: "Linux",
  description: "Router per la casa",
  assets: [],
};

const sampleAsset: Asset = {
  id: "AS-1",
  name: "Credenziali utente",
  type: "security",
  description: "Codici PIN memorizzati sul dispositivo.",
  sensitive: true,
  requirements: ["ACM-1"],
};

beforeEach(() => {
  useDeviceStore.getState().reset();
});

describe("DeviceStore", () => {
  it("starts with no device and an empty asset list", () => {
    expect(useDeviceStore.getState().device).toBeNull();
    expect(useDeviceStore.getState().assets).toEqual([]);
  });

  it("setDevice stores the device and payload", () => {
    useDeviceStore.getState().setDevice(sampleDevice, { name: "Router1" });

    expect(useDeviceStore.getState().device).toEqual(sampleDevice);
    expect(useDeviceStore.getState().payload).toEqual({ name: "Router1" });
  });

  it("setDevice resets the asset list", () => {
    useDeviceStore.getState().addAsset(sampleAsset);

    useDeviceStore.getState().setDevice(sampleDevice, {});

    expect(useDeviceStore.getState().assets).toEqual([]);
  });

  it("addAsset appends an asset to the list", () => {
    useDeviceStore.getState().addAsset(sampleAsset);

    expect(useDeviceStore.getState().assets).toEqual([sampleAsset]);
  });

  it("addAsset keeps previously added assets", () => {
    const secondAsset: Asset = { ...sampleAsset, id: "AS-2", name: "Registro accessi" };

    useDeviceStore.getState().addAsset(sampleAsset);
    useDeviceStore.getState().addAsset(secondAsset);

    expect(useDeviceStore.getState().assets).toEqual([sampleAsset, secondAsset]);
  });

  it("removeAsset removes only the matching asset", () => {
    const secondAsset: Asset = { ...sampleAsset, id: "AS-2", name: "Registro accessi" };
    useDeviceStore.getState().addAsset(sampleAsset);
    useDeviceStore.getState().addAsset(secondAsset);

    useDeviceStore.getState().removeAsset("AS-1");

    expect(useDeviceStore.getState().assets).toEqual([secondAsset]);
  });

  it("removeAsset does nothing when the id is not found", () => {
    useDeviceStore.getState().addAsset(sampleAsset);

    useDeviceStore.getState().removeAsset("does-not-exist");

    expect(useDeviceStore.getState().assets).toEqual([sampleAsset]);
  });

  it("reset clears device, payload and assets", () => {
    useDeviceStore.getState().setDevice(sampleDevice, { name: "Router1" });
    useDeviceStore.getState().addAsset(sampleAsset);

    useDeviceStore.getState().reset();

    expect(useDeviceStore.getState().device).toBeNull();
    expect(useDeviceStore.getState().payload).toBeNull();
    expect(useDeviceStore.getState().assets).toEqual([]);
  });
});
