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
    <div className="home-shell">
      <aside className="home-sidebar">
        <h1 className="home-sidebar__title">
          EN 18031
          <br />
          Compliance Verification
        </h1>
        <span className="home-sidebar__divider" aria-hidden="true" />
      </aside>

      <main className="home-main">
        <div>
          <div className="home-intro">
            <h2>Da dove vuoi partire?</h2>
            <p>Scegli come iniziare la tua valutazione.</p>
          </div>

          <div className="home-grid">
            <section className="card home-card">
              <h3 className="home-card__title">Crea dispositivo</h3>
              <p className="home-card__desc">Registra un nuovo dispositivo da zero.</p>
              <button
                type="button"
                className="btn btn--primary btn--block"
                onClick={() => navigate("/device/new")}
              >
                Crea nuovo dispositivo
              </button>
            </section>

            <section className="card home-card">
              <h3 className="home-card__title">Importa dispositivo</h3>
              <p className="home-card__desc">Importa un dispositivo da file JSON o CSV.</p>
              <label className="btn btn--primary btn--block" htmlFor="home-import-device">
                Scegli file da importare
              </label>
              <input
                id="home-import-device"
                type="file"
                aria-label="Carica file JSON o CSV dispositivo"
                accept=".json,application/json,.csv,text/csv"
                onChange={(e) => readFileOnUpload(e.target.files?.[0])}
                style={{ display: "none" }}
              />
            </section>

            <section className="card home-card">
              <h3 className="home-card__title">Riprendi sessione</h3>
              <p className="home-card__desc">Riprendi una valutazione salvata in precedenza.</p>
              <label className="btn btn--primary btn--block" htmlFor="home-resume-session">
                Carica sessione salvata
              </label>
              <input
                id="home-resume-session"
                type="file"
                aria-label="Riprendi sessione da file"
                accept=".json,application/json"
                onChange={(e) => resumeSessionOnUpload(e.target.files?.[0])}
                style={{ display: "none" }}
              />
            </section>

            <section className="card home-card">
              <h3 className="home-card__title">Catalogo decision tree</h3>
              <p className="home-card__desc">Consulta i decision tree dei requisiti EN 18031.</p>
              <button
                type="button"
                className="btn btn--primary btn--block"
                onClick={() => navigate("/decision-tree-catalog")}
              >
                Esplora il catalogo
              </button>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
