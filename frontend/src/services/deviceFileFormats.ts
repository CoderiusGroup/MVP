import { DeviceImportSchema, type Device, type DeviceImport } from "../domain/entities/Device";

export interface DeviceFileFormat {
  extension: string;
  mimeType: string;
  serialize(device: Device): string;
  parse(text: string): DeviceImport;
}

function serializeJson(device: Device): string {
  return JSON.stringify(device, null, 2);
}

function parseJson(text: string): DeviceImport {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Il file non è in formato JSON");
  }

  const result = DeviceImportSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error("Il file non contiene un dispositivo valido");
  }
  return result.data;
}

export const jsonDeviceFormat: DeviceFileFormat = {
  extension: ".json",
  mimeType: "application/json",
  serialize: serializeJson,
  parse: parseJson,
};

const CSV_HEADER = [
  "device.id",
  "device.name",
  "device.operatingSystem",
  "device.description",
  "asset.id",
  "asset.name",
  "asset.type",
  "asset.description",
  "asset.sensitive",
  "asset.requirements",
];

function escapeCsvField(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields;
}

function serializeCsv(device: Device): string {
  const rows = [CSV_HEADER.join(",")];
  const deviceFields = [device.id, device.name, device.operatingSystem, device.description];

  if (device.assets.length === 0) {
    rows.push([...deviceFields, "", "", "", "", "", ""].map(escapeCsvField).join(","));
  } else {
    for (const asset of device.assets) {
      rows.push(
        [
          ...deviceFields,
          asset.id,
          asset.name,
          asset.type,
          asset.description,
          String(asset.sensitive),
          (asset.requirements ?? []).join(";"),
        ]
          .map(escapeCsvField)
          .join(","),
      );
    }
  }

  return rows.join("\n");
}

function parseCsv(text: string): DeviceImport {
  const lines = text.split(/\r?\n/).filter((line) => line.length > 0);
  if (lines.length < 2) {
    throw new Error("Il file CSV non contiene dati validi");
  }

  const header = parseCsvLine(lines[0]);
  if (header.join(",") !== CSV_HEADER.join(",")) {
    throw new Error("Il file CSV non ha l'intestazione attesa");
  }

  const rows = lines.slice(1).map(parseCsvLine);
  const [firstRow] = rows;

  const assets: DeviceImport["assets"] = [];
  for (const row of rows) {
    const [, , , , assetId, assetName, assetType, assetDescription, assetSensitive, assetRequirements] =
      row;
    if (!assetId && !assetName) {
      continue;
    }
    assets.push({
      id: assetId || undefined,
      name: assetName,
      type: assetType as DeviceImport["assets"][number]["type"],
      description: assetDescription,
      sensitive: assetSensitive === "true",
      requirements: assetRequirements ? assetRequirements.split(";").filter(Boolean) : undefined,
    });
  }

  const result = DeviceImportSchema.safeParse({
    id: firstRow[0] || undefined,
    name: firstRow[1],
    operatingSystem: firstRow[2],
    description: firstRow[3],
    assets,
  });
  if (!result.success) {
    throw new Error("Il file CSV non contiene un dispositivo valido");
  }
  return result.data;
}

export const csvDeviceFormat: DeviceFileFormat = {
  extension: ".csv",
  mimeType: "text/csv",
  serialize: serializeCsv,
  parse: parseCsv,
};

export function formatForFile(file: File): DeviceFileFormat | null {
  const name = file.name.toLowerCase();
  if (name.endsWith(".json") || file.type === "application/json") {
    return jsonDeviceFormat;
  }
  if (name.endsWith(".csv") || file.type === "text/csv") {
    return csvDeviceFormat;
  }
  return null;
}
