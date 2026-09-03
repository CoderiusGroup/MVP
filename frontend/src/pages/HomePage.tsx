import { useNavigate } from "react-router-dom";
import { NotificationManager } from "../infrastructure/NotificationManager";
import { importDeviceFromFile } from "../services/DeviceService";
import { loadSessionFromJson } from "../services/SessionService";
import type { Device } from "../domain/entities/Device";
import type { Session } from "../domain/entities/Session";

type Props = {
  onDeviceSaved: (device: Device, payload: unknown) => void;
  onSessionResumed: (session: Session) => void;
};

const notification = new NotificationManager();

export default function HomePage({ onDeviceSaved, onSessionResumed }: Props) {
  const navigate = useNavigate();

  const resumeSessionOnUpload = async (uploadedFile?: File) => {
    if (!uploadedFile) {
      notification.errorWithFallback("Nessun file selezionato");
      return;
    }

    try {
      const session = await loadSessionFromJson(uploadedFile);
      onSessionResumed(session);
      notification.success("Sessione ripresa correttamente");
    } catch (e) {
      console.error("Resume error", e);
      notification.errorWithFallback(
        e instanceof Error ? e.message : "Errore durante il caricamento della sessione",
      );
    }
  };

  const readFileOnUpload = async (uploadedFile?: File) => {
    if (!uploadedFile) {
      notification.errorWithFallback("Nessun file selezionato");
      return;
    }

    try {
      const { device, payload } = await importDeviceFromFile(uploadedFile);
      onDeviceSaved(device, payload);
      notification.success("Dispositivo caricato correttamente");
    } catch (e) {
      console.error("Upload error", e);
      notification.errorWithFallback(
        e instanceof Error ? e.message : "Errore durante il caricamento del file",
      );
    }
  };

  return (
    <div style={{ padding: "1rem" }}>
      <h1>Gestione Valutazione Dispositivi</h1>

      <h2>1. Nuovo Dispositivo</h2>
      <button onClick={() => navigate("/device/new")}>Crea nuovo dispositivo</button>

      <h2>2. Importa Dispositivo da JSON o CSV</h2>
      <input
        type="file"
        aria-label="Carica file JSON o CSV dispositivo"
        accept=".json,application/json,.csv,text/csv"
        onChange={(e) => readFileOnUpload(e.target.files?.[0])}
      />

      <h2>3. Riprendi una Sessione Salvata</h2>
      <input
        type="file"
        aria-label="Riprendi sessione da file"
        accept=".json,application/json"
        onChange={(e) => resumeSessionOnUpload(e.target.files?.[0])}
      />

      <h2>4. Catalogo Decision Tree</h2>
      <button type="button" onClick={() => navigate("/decision-tree-catalog")}>
        Apri catalogo decision tree
      </button>
    </div>
  );
}
