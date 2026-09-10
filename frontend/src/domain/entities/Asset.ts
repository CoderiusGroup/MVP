import { z } from "zod";

const identifier = z.string().min(1).max(64);
const requirementCode = z.string().regex(/^[A-Z]{2,4}(-[A-Za-z0-9]+)+$/);

export const AssetSchema = z.object({
  id: identifier,
  name: z.string().min(1).max(100),
  type: z.enum(["network", "security", "privacy", "financial"]),
  description: z.string().min(1).max(1000),
  sensitive: z.boolean(),
  requirements: z.array(requirementCode).optional(),
});

export const AssetCreateSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(["network", "security", "privacy", "financial"]),
  description: z.string().min(1).max(1000),
  sensitive: z.boolean(),
  requirements: z.array(requirementCode).optional(),
});

export const AssetImportSchema = AssetCreateSchema.extend({
  id: identifier.optional(),
});

export type AssetType = z.infer<typeof AssetSchema>["type"];
export type AssetCreate = z.infer<typeof AssetCreateSchema>;
export type AssetImport = z.infer<typeof AssetImportSchema>;

export interface AssetDetailsPatch {
  name: string;
  type: AssetType;
  description: string;
  sensitive: boolean;
}

export class Asset {
  readonly #id: string;
  readonly #name: string;
  readonly #type: AssetType;
  readonly #description: string;
  readonly #sensitive: boolean;
  readonly #requirements: string[] | undefined;

  constructor(
    id: string,
    name: string,
    type: AssetType,
    description: string,
    sensitive: boolean,
    requirements?: string[],
  ) {
    this.#id = id;
    this.#name = name;
    this.#type = type;
    this.#description = description;
    this.#sensitive = sensitive;
    this.#requirements = requirements;
  }

  get id(): string {
    return this.#id;
  }

  get name(): string {
    return this.#name;
  }

  get type(): AssetType {
    return this.#type;
  }

  get description(): string {
    return this.#description;
  }

  get sensitive(): boolean {
    return this.#sensitive;
  }

  get requirements(): string[] | undefined {
    return this.#requirements;
  }

  withDetails(patch: AssetDetailsPatch): Asset {
    return new Asset(
      this.#id,
      patch.name,
      patch.type,
      patch.description,
      patch.sensitive,
      this.#requirements,
    );
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      description: this.description,
      sensitive: this.sensitive,
      requirements: this.requirements,
    };
  }

  static create(raw: unknown): Asset {
    const parsed = AssetSchema.parse(raw);
    return new Asset(
      parsed.id,
      parsed.name,
      parsed.type,
      parsed.description,
      parsed.sensitive,
      parsed.requirements,
    );
  }
}
