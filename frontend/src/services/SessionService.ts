import { Session } from "../domain/entities/Session";

export { buildPlan } from "../domain/rules/sessionRules";
export type { EvaluationPair } from "../domain/rules/sessionRules";

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
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${file.id}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function loadSessionFromJson(file: File): Promise<Session> {
  const isJsonFile =
    file.name.toLowerCase().endsWith(".json") || file.type === "application/json";
  if (!isJsonFile) {
    throw new Error("Il file caricato non è un JSON valido");
  }
  return parseSessionFile(await readFileAsText(file));
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
