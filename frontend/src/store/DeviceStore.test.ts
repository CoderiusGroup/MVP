import { beforeEach, describe, expect, it } from "vitest";

import type { Asset } from "../domain/entities/Asset";
import type { Device } from "../domain/entities/Device";
import { useDeviceStore } from "./DeviceStore";
import { useSessionStore } from "./SessionStore";

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
  useSessionStore.getState().reset();
});

describe("DeviceStore", () => {
  it("starts with no device", () => {
    expect(useDeviceStore.getState().device).toBeNull();
    expect(useDeviceStore.getState().payload).toBeNull();
  });

  it("setDevice stores the device and payload", () => {
    useDeviceStore.getState().setDevice(sampleDevice, { name: "Router1" });

    expect(useDeviceStore.getState().device).toEqual(sampleDevice);
    expect(useDeviceStore.getState().payload).toEqual({ name: "Router1" });
  });

  it("setDevice replaces the device together with its assets", () => {
    useDeviceStore.getState().setDevice(sampleDevice, {});
    useDeviceStore.getState().addAsset(sampleAsset);

    useDeviceStore.getState().setDevice(sampleDevice, {});

    expect(useDeviceStore.getState().device?.assets).toEqual([]);
  });

  it("setDevice resets an existing session", () => {
    useDeviceStore.getState().setDevice(sampleDevice, {});
    useSessionStore.getState().start(sampleDevice);
    expect(useSessionStore.getState().session).not.toBeNull();

    useDeviceStore.getState().setDevice(sampleDevice, {});

    expect(useSessionStore.getState().session).toBeNull();
  });

  it("addAsset appends an asset to the device", () => {
    useDeviceStore.getState().setDevice(sampleDevice, {});
    useDeviceStore.getState().addAsset(sampleAsset);

    expect(useDeviceStore.getState().device?.assets).toEqual([sampleAsset]);
  });

  it("addAsset keeps previously added assets", () => {
    const secondAsset: Asset = { ...sampleAsset, id: "AS-2", name: "Registro accessi" };

    useDeviceStore.getState().setDevice(sampleDevice, {});
    useDeviceStore.getState().addAsset(sampleAsset);
    useDeviceStore.getState().addAsset(secondAsset);

    expect(useDeviceStore.getState().device?.assets).toEqual([sampleAsset, secondAsset]);
  });

  it("addAsset does nothing when there is no device", () => {
    useDeviceStore.getState().addAsset(sampleAsset);

    expect(useDeviceStore.getState().device).toBeNull();
  });

  it("removeAsset removes only the matching asset", () => {
    const secondAsset: Asset = { ...sampleAsset, id: "AS-2", name: "Registro accessi" };
    useDeviceStore.getState().setDevice(sampleDevice, {});
    useDeviceStore.getState().addAsset(sampleAsset);
    useDeviceStore.getState().addAsset(secondAsset);

    useDeviceStore.getState().removeAsset("AS-1");

    expect(useDeviceStore.getState().device?.assets).toEqual([secondAsset]);
  });

  it("removeAsset does nothing when the id is not found", () => {
    useDeviceStore.getState().setDevice(sampleDevice, {});
    useDeviceStore.getState().addAsset(sampleAsset);

    useDeviceStore.getState().removeAsset("does-not-exist");

    expect(useDeviceStore.getState().device?.assets).toEqual([sampleAsset]);
  });

  it("reset clears device and payload", () => {
    useDeviceStore.getState().setDevice(sampleDevice, { name: "Router1" });
    useDeviceStore.getState().addAsset(sampleAsset);

    useDeviceStore.getState().reset();

    expect(useDeviceStore.getState().device).toBeNull();
    expect(useDeviceStore.getState().payload).toBeNull();
  });
});
