import { describe, expect, it } from "vitest";

import type { Device } from "../domain/entities/Device";
import { csvDeviceFormat, formatForFile, jsonDeviceFormat } from "./deviceFileFormats";

const deviceWithAssets: Device = {
  id: "DEV-1",
  name: "Coffee Machine",
  operatingSystem: "Linux",
  description: "Macchina per fare il caffè",
  assets: [
    {
      id: "AS-1",
      name: "Modulo Wi-Fi",
      type: "network",
      description: "Interfaccia di rete, con \"virgolette\", e virgole, incluse",
      sensitive: false,
      requirements: ["ACM-1", "ACM-2"],
    },
    {
      id: "AS-2",
      name: "Credenziali app",
      type: "security",
      description: "Token salvati",
      sensitive: true,
      requirements: ["ACM-1"],
    },
  ],
};

const deviceWithoutAssets: Device = {
  id: "DEV-2",
  name: "Router",
  operatingSystem: "OpenWRT",
  description: "Router domestico",
  assets: [],
};

describe("jsonDeviceFormat", () => {
  it("fa un round-trip serialize/parse preservando device e asset", () => {
    const text = jsonDeviceFormat.serialize(deviceWithAssets);
    const parsed = jsonDeviceFormat.parse(text);

    expect(parsed).toEqual(deviceWithAssets);
  });

  it("rifiuta un testo non JSON", () => {
    expect(() => jsonDeviceFormat.parse("non è json")).toThrow("Il file non è in formato JSON");
  });

  it("rifiuta un JSON che non è un dispositivo valido", () => {
    expect(() => jsonDeviceFormat.parse(JSON.stringify([1, 2, 3]))).toThrow(
      "Il file non contiene un dispositivo valido",
    );
  });

  it("accetta un device senza id (generato poi dal backend)", () => {
    const withoutId = { ...deviceWithoutAssets, id: undefined };
    const text = JSON.stringify(withoutId);

    const parsed = jsonDeviceFormat.parse(text);

    expect(parsed.id).toBeUndefined();
    expect(parsed.name).toBe("Router");
  });
});

describe("csvDeviceFormat", () => {
  it("fa un round-trip serialize/parse preservando device e asset", () => {
    const text = csvDeviceFormat.serialize(deviceWithAssets);
    const parsed = csvDeviceFormat.parse(text);

    expect(parsed).toEqual(deviceWithAssets);
  });

  it("gestisce correttamente un device senza asset con una sola riga", () => {
    const text = csvDeviceFormat.serialize(deviceWithoutAssets);
    const lines = text.split("\n");

    expect(lines).toHaveLength(2);

    const parsed = csvDeviceFormat.parse(text);
    expect(parsed.name).toBe("Router");
    expect(parsed.assets).toEqual([]);
  });

  it("esegue l'escaping di virgole e virgolette nella description", () => {
    const text = csvDeviceFormat.serialize(deviceWithAssets);

    expect(text).toContain('"Interfaccia di rete, con ""virgolette"", e virgole, incluse"');
  });

  it("rifiuta un CSV senza righe di dati", () => {
    expect(() => csvDeviceFormat.parse(csvDeviceFormat.serialize(deviceWithoutAssets).split("\n")[0])).toThrow(
      "Il file CSV non contiene dati validi",
    );
  });

  it("un asset con requirements esplicitamente vuoto torna 'undefined' al parse (limite noto: il CSV non distingue '[]' da 'assente')", () => {
    const deviceWithEmptyRequirements: Device = {
      ...deviceWithoutAssets,
      assets: [{ ...deviceWithAssets.assets[0], requirements: [] }],
    };

    const parsed = csvDeviceFormat.parse(csvDeviceFormat.serialize(deviceWithEmptyRequirements));

    expect(parsed.assets[0].requirements).toBeUndefined();
  });

  it("rifiuta un CSV con intestazione diversa da quella attesa", () => {
    expect(() => csvDeviceFormat.parse("a,b,c\n1,2,3")).toThrow(
      "Il file CSV non ha l'intestazione attesa",
    );
  });
});

describe("formatForFile", () => {
  it("riconosce un file .json", () => {
    const file = new File(["{}"], "device.json", { type: "application/json" });
    expect(formatForFile(file)).toBe(jsonDeviceFormat);
  });

  it("riconosce un file .csv", () => {
    const file = new File(["a,b"], "device.csv", { type: "text/csv" });
    expect(formatForFile(file)).toBe(csvDeviceFormat);
  });

  it("ritorna null per un formato non supportato", () => {
    const file = new File(["a,b"], "device.txt", { type: "text/plain" });
    expect(formatForFile(file)).toBeNull();
  });
});
