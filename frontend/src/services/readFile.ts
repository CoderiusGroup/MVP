export function readFileAsText(file: File): Promise<string> {
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
