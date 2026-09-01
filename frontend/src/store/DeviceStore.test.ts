import { beforeEach, describe, expect, it } from "vitest";

import { Asset } from "../domain/entities/Asset";
import { Device } from "../domain/entities/Device";
import { useDeviceStore } from "./DeviceStore";
import { useSessionStore } from "./SessionStore";

const sampleDevice = Device.create({
  id: "DEV-1",
  name: "Router1",
  operatingSystem: "Linux",
  description: "Router per la casa",
  assets: [],
});

const sampleAsset = Asset.create({
  id: "AS-1",
  name: "Credenziali utente",
  type: "security",
  description: "Codici PIN memorizzati sul dispositivo.",
  sensitive: true,
  requirements: ["ACM-1"],
});

function assetsToJSON(assets: Asset[] | undefined) {
  return (assets ?? []).map((asset) => asset.toJSON());
}

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

    expect(useDeviceStore.getState().device?.toJSON()).toEqual(sampleDevice.toJSON());
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

  it("updateDeviceDetails updates name/operatingSystem/description preserving id and assets (RF-D11-14)", () => {
    useDeviceStore.getState().setDevice(sampleDevice, {});
    useDeviceStore.getState().addAsset(sampleAsset);

    useDeviceStore.getState().updateDeviceDetails({
      name: "Router aggiornato",
      operatingSystem: "OpenWRT",
      description: "Nuova descrizione",
    });

    expect(useDeviceStore.getState().device?.toJSON()).toEqual({
      ...sampleDevice.toJSON(),
      name: "Router aggiornato",
      operatingSystem: "OpenWRT",
      description: "Nuova descrizione",
      assets: [sampleAsset.toJSON()],
    });
  });

  it("updateDeviceDetails resets an existing session too, coerente con setDevice/reset", () => {
    useDeviceStore.getState().setDevice(sampleDevice, {});
    useSessionStore.getState().start(sampleDevice);
    expect(useSessionStore.getState().session).not.toBeNull();

    useDeviceStore.getState().updateDeviceDetails({
      name: "Router aggiornato",
      operatingSystem: "OpenWRT",
      description: "Nuova descrizione",
    });

    expect(useSessionStore.getState().session).toBeNull();
  });

  it("updateDeviceDetails does nothing when there is no device", () => {
    useDeviceStore.getState().updateDeviceDetails({
      name: "x",
      operatingSystem: "x",
      description: "x",
    });

    expect(useDeviceStore.getState().device).toBeNull();
  });

  it("addAsset appends an asset to the device", () => {
    useDeviceStore.getState().setDevice(sampleDevice, {});
    useDeviceStore.getState().addAsset(sampleAsset);

    expect(assetsToJSON(useDeviceStore.getState().device?.assets)).toEqual([
      sampleAsset.toJSON(),
    ]);
  });

  it("addAsset keeps previously added assets", () => {
    const secondAsset = Asset.create({ ...sampleAsset.toJSON(), id: "AS-2", name: "Registro accessi" });

    useDeviceStore.getState().setDevice(sampleDevice, {});
    useDeviceStore.getState().addAsset(sampleAsset);
    useDeviceStore.getState().addAsset(secondAsset);

    expect(assetsToJSON(useDeviceStore.getState().device?.assets)).toEqual([
      sampleAsset.toJSON(),
      secondAsset.toJSON(),
    ]);
  });

  it("addAsset does nothing when there is no device", () => {
    useDeviceStore.getState().addAsset(sampleAsset);

    expect(useDeviceStore.getState().device).toBeNull();
  });

  it("updateAsset replaces only the matching asset", () => {
    const secondAsset = Asset.create({ ...sampleAsset.toJSON(), id: "AS-2", name: "Registro accessi" });
    useDeviceStore.getState().setDevice(sampleDevice, {});
    useDeviceStore.getState().addAsset(sampleAsset);
    useDeviceStore.getState().addAsset(secondAsset);

    const updated = Asset.create({ ...sampleAsset.toJSON(), name: "Credenziali aggiornate" });
    useDeviceStore.getState().updateAsset(updated);

    expect(assetsToJSON(useDeviceStore.getState().device?.assets)).toEqual([
      updated.toJSON(),
      secondAsset.toJSON(),
    ]);
  });

  it("updateAsset does nothing when there is no device", () => {
    useDeviceStore.getState().updateAsset(sampleAsset);

    expect(useDeviceStore.getState().device).toBeNull();
  });

  it("removeAsset removes only the matching asset", () => {
    const secondAsset = Asset.create({ ...sampleAsset.toJSON(), id: "AS-2", name: "Registro accessi" });
    useDeviceStore.getState().setDevice(sampleDevice, {});
    useDeviceStore.getState().addAsset(sampleAsset);
    useDeviceStore.getState().addAsset(secondAsset);

    useDeviceStore.getState().removeAsset("AS-1");

    expect(assetsToJSON(useDeviceStore.getState().device?.assets)).toEqual([
      secondAsset.toJSON(),
    ]);
  });

  it("removeAsset does nothing when the id is not found", () => {
    useDeviceStore.getState().setDevice(sampleDevice, {});
    useDeviceStore.getState().addAsset(sampleAsset);

    useDeviceStore.getState().removeAsset("does-not-exist");

    expect(assetsToJSON(useDeviceStore.getState().device?.assets)).toEqual([
      sampleAsset.toJSON(),
    ]);
  });

  it("reset clears device and payload", () => {
    useDeviceStore.getState().setDevice(sampleDevice, { name: "Router1" });
    useDeviceStore.getState().addAsset(sampleAsset);

    useDeviceStore.getState().reset();

    expect(useDeviceStore.getState().device).toBeNull();
    expect(useDeviceStore.getState().payload).toBeNull();
  });

  it("reset clears an existing session too (RF-Ob22)", () => {
    useDeviceStore.getState().setDevice(sampleDevice, {});
    useSessionStore.getState().start(sampleDevice);
    expect(useSessionStore.getState().session).not.toBeNull();

    useDeviceStore.getState().reset();

    expect(useSessionStore.getState().session).toBeNull();
  });
});
