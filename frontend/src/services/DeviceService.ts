import { FetchApiClient } from "../infrastructure/FetchApiClient";
import {
  DeviceSchema,
  DeviceCreateSchema,
  type Device,
  type DeviceCreate,
} from "../domain/entities/Device";
import {
  AssetSchema,
  AssetCreateSchema,
  type Asset,
  type AssetCreate,
} from "../domain/entities/Asset";

const apiClient = new FetchApiClient();

export interface DeviceSaveResult {
  device: Device;
  payload: DeviceCreate;
}

export async function importDeviceFromJson(file: File): Promise<DeviceSaveResult> {
  const isJsonFile =
    file.name.toLowerCase().endsWith(".json") || file.type === "application/json";
  if (!isJsonFile) {
    throw new Error("Il file caricato non è un JSON valido");
  }

  const text = await readFileAsText(file);

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Il file non è in formato Json");
  }

  const result = DeviceCreateSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error("Il file deve contenere un singolo dispositivo");
  }

  return saveDevice(result.data);
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
