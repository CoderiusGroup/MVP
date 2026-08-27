import { FetchApiClient } from "../infrastructure/FetchApiClient";
import {
  DeviceSchema,
  DeviceCreateSchema,
  type Device,
  type DeviceCreate,
  type DeviceImport,
} from "../domain/entities/Device";
import {
  AssetSchema,
  AssetCreateSchema,
  type Asset,
  type AssetCreate,
} from "../domain/entities/Asset";
import { formatForFile, type DeviceFileFormat } from "./deviceFileFormats";

const apiClient = new FetchApiClient();

export interface DeviceSaveResult {
  device: Device;
  payload: DeviceImport | DeviceCreate;
}

export async function importDeviceFromFile(file: File): Promise<DeviceSaveResult> {
  const format = formatForFile(file);
  if (!format) {
    throw new Error("Formato file non supportato: usa JSON o CSV");
  }

  const text = await readFileAsText(file);
  const parsed = format.parse(text);

  const deviceRaw = await apiClient.post<unknown>("/devices", {
    id: parsed.id,
    name: parsed.name,
    operatingSystem: parsed.operatingSystem,
    description: parsed.description,
  });
  const deviceShell = DeviceSchema.parse(deviceRaw);

  const assets = await Promise.all(
    parsed.assets.map(async (asset) => {
      const assetRaw = await apiClient.post<unknown>("/assets", {
        id: asset.id,
        name: asset.name,
        type: asset.type,
        description: asset.description,
        sensitive: asset.sensitive,
        requirements: asset.requirements,
      });
      return AssetSchema.parse(assetRaw);
    }),
  );

  return { device: { ...deviceShell, assets }, payload: parsed };
}

export function exportDevice(device: Device, format: DeviceFileFormat): void {
  const content = format.serialize(device);
  const blob = new Blob([content], { type: format.mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${device.id}${format.extension}`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function createDeviceManually(payload: DeviceCreate): Promise<DeviceSaveResult> {
  const result = DeviceCreateSchema.safeParse(payload);
  if (!result.success) {
    throw new Error("Il campo Nome è obbligatorio");
  }

  return saveDevice(result.data);
}

export async function createAsset(payload: AssetCreate): Promise<Asset> {
  const result = AssetCreateSchema.safeParse(payload);
  if (!result.success) {
    throw new Error("Dati asset non validi");
  }

  const raw = await apiClient.post<unknown>("/assets", result.data);
  return AssetSchema.parse(raw);
}

export async function updateAsset(existingAsset: Asset, payload: AssetCreate): Promise<Asset> {
  const result = AssetCreateSchema.safeParse(payload);
  if (!result.success) {
    throw new Error("Dati asset non validi");
  }

  if (result.data.type === existingAsset.type) {
    return { ...existingAsset, ...result.data };
  }
  const raw = await apiClient.post<unknown>("/assets", {
    id: existingAsset.id,
    name: result.data.name,
    type: result.data.type,
    description: result.data.description,
    sensitive: result.data.sensitive,
  });
  return AssetSchema.parse(raw);
}

async function saveDevice(payload: DeviceCreate): Promise<DeviceSaveResult> {
  const raw = await apiClient.post<unknown>("/devices", payload);
  const device = DeviceSchema.parse(raw);
  return { device, payload };
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Errore durante la lettura del file"));
      }
    };
    reader.onerror = () => reject(new Error("Errore durante il caricamento del file"));
    reader.readAsText(file);
  });
}
