import { z } from "zod";

import { Asset, AssetImportSchema, AssetSchema } from "./Asset";

const identifier = z.string().min(1).max(64);

export const DeviceSchema = z.object({
  id: identifier,
  name: z.string().min(1).max(100),
  operatingSystem: z.string().min(1).max(100),
  description: z.string().min(1).max(1000),
  assets: z.array(AssetSchema),
});

export const DeviceCreateSchema = z.object({
  name: z.string().min(1),
  operatingSystem: z.string().optional().default(""),
  description: z.string().optional().default(""),
});

export const DeviceImportSchema = z.object({
  id: identifier.optional(),
  name: z.string().min(1).max(100),
  operatingSystem: z.string().min(1).max(100),
  description: z.string().min(1).max(1000),
  assets: z.array(AssetImportSchema).default([]),
});

export type DeviceCreate = z.infer<typeof DeviceCreateSchema>;
export type DeviceImport = z.infer<typeof DeviceImportSchema>;

export interface DeviceDetailsPatch {
  name: string;
  operatingSystem: string;
  description: string;
}

type AssetRawShape = z.infer<typeof AssetSchema>;

function assetFromRaw(raw: AssetRawShape): Asset {
  return new Asset(raw.id, raw.name, raw.type, raw.description, raw.sensitive, raw.requirements);
}

export class Device {
  readonly #id: string;
  readonly #name: string;
  readonly #operatingSystem: string;
  readonly #description: string;
  readonly #assets: Asset[];

  constructor(
    id: string,
    name: string,
    operatingSystem: string,
    description: string,
    assets: Asset[] = [],
  ) {
    this.#id = id;
    this.#name = name;
    this.#operatingSystem = operatingSystem;
    this.#description = description;
    this.#assets = assets;
  }

  get id(): string {
    return this.#id;
  }

  get name(): string {
    return this.#name;
  }

  get operatingSystem(): string {
    return this.#operatingSystem;
  }

  get description(): string {
    return this.#description;
  }

  get assets(): Asset[] {
    return this.#assets;
  }

  withDetails(patch: DeviceDetailsPatch): Device {
    return new Device(this.#id, patch.name, patch.operatingSystem, patch.description, this.#assets);
  }

  withAssets(assets: Asset[]): Device {
    return new Device(this.#id, this.#name, this.#operatingSystem, this.#description, assets);
  }

  withAssetAdded(asset: Asset): Device {
    return this.withAssets([...this.#assets, asset]);
  }

  withAssetUpdated(asset: Asset): Device {
    return this.withAssets(
      this.#assets.map((existing) => (existing.id === asset.id ? asset : existing)),
    );
  }

  withAssetRemoved(assetId: string): Device {
    return this.withAssets(this.#assets.filter((asset) => asset.id !== assetId));
  }

  buildPlan(): { assetId: string; requirementId: string }[] {
    const pairs: { assetId: string; requirementId: string }[] = [];
    for (const asset of this.#assets) {
      for (const requirementId of asset.requirements ?? []) {
        pairs.push({ assetId: asset.id, requirementId });
      }
    }
    return pairs;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      operatingSystem: this.operatingSystem,
      description: this.description,
      assets: this.assets.map((asset) => asset.toJSON()),
    };
  }

  static create(raw: unknown): Device {
    const parsed = DeviceSchema.parse(raw);
    return new Device(
      parsed.id,
      parsed.name,
      parsed.operatingSystem,
      parsed.description,
      parsed.assets.map(assetFromRaw),
    );
  }
}
