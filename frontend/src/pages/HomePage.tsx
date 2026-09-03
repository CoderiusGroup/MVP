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
    <div className="page">
      <header className="page__header">
        <h1 className="page__title">Gestione Valutazione Dispositivi</h1>
      </header>

      <div className="card-grid">
        <section className="card">
          <h2 className="card__title">Nuovo dispositivo</h2>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => navigate("/device/new")}
          >
            Crea nuovo dispositivo
          </button>
        </section>

        <section className="card">
          <h2 className="card__title">Importa dispositivo da JSON o CSV</h2>
          <input
            type="file"
            aria-label="Carica file JSON o CSV dispositivo"
            accept=".json,application/json,.csv,text/csv"
            onChange={(e) => readFileOnUpload(e.target.files?.[0])}
          />
        </section>

        <section className="card">
          <h2 className="card__title">Riprendi una sessione salvata</h2>
          <input
            type="file"
            aria-label="Riprendi sessione da file"
            accept=".json,application/json"
            onChange={(e) => resumeSessionOnUpload(e.target.files?.[0])}
          />
        </section>

        <section className="card">
          <h2 className="card__title">Catalogo decision tree</h2>
          <button
            type="button"
            className="btn"
            onClick={() => navigate("/decision-tree-catalog")}
          >
            Apri catalogo decision tree
          </button>
        </section>
      </div>
    </div>
  );
}
