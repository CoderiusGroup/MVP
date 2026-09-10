import { Session } from "../domain/entities/Session";
import { downloadBlob } from "./downloadFile";
import { readFileAsText } from "./readFile";

export function toSessionFile(session: Session): Session {
  return session.withSavedAt(new Date().toISOString());
}

export function parseSessionFile(text: string): Session {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Il file non è in formato JSON");
  }

  try {
    return Session.parse(parsed);
  } catch {
    throw new Error("Il file non contiene una sessione valida");
  }
}

export function downloadSession(session: Session): void {
  const file = toSessionFile(session);
  const blob = new Blob([JSON.stringify(file, null, 2)], { type: "application/json" });
  downloadBlob(blob, `${file.id}.json`);
}

export async function loadSessionFromJson(file: File): Promise<Session> {
  const isJsonFile =
    file.name.toLowerCase().endsWith(".json") || file.type === "application/json";
  if (!isJsonFile) {
    throw new Error("Il file caricato non è un JSON valido");
  }
  return parseSessionFile(await readFileAsText(file));
}
