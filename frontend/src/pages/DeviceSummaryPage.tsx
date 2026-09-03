import { useNavigate } from "react-router-dom";
import { Page } from "../components/Page";
import { StatusBadge } from "../components/StatusBadge";
import { getDeviceStatus } from "../domain/rules/sessionRules";
import { exportDevice } from "../services/DeviceService";
import { csvDeviceFormat, jsonDeviceFormat } from "../services/deviceFileFormats";
import { useDeviceStore } from "../store/DeviceStore";
import { useSessionStore } from "../store/SessionStore";

export default function DeviceSummaryPage() {
  const navigate = useNavigate();
  const device = useDeviceStore((state) => state.device);
  const resetDevice = useDeviceStore((state) => state.reset);
  const session = useSessionStore((state) => state.session);
  const ensureSession = useSessionStore((state) => state.ensureSession);

  const hasAssets = !!device && device.assets.length > 0;

  const handleStart = () => {
    if (!device) {
      return;
    }
    ensureSession(device);
    navigate("/session");
  };

  const handleDelete = () => {
    if (
      window.confirm(
        "Confermi l'eliminazione definitiva del dispositivo? L'operazione non è reversibile.",
      )
    ) {
      resetDevice();
      navigate("/");
    }
  };

  const handleDeleteWithBackup = () => {
    if (!device) {
      return;
    }
    if (
      window.confirm(
        "Confermi l'eliminazione del dispositivo? Verrà scaricato prima un backup in JSON.",
      )
    ) {
      exportDevice(device, jsonDeviceFormat);
      resetDevice();
      navigate("/");
    }
  };

  return (
    <Page
      title="Riepilogo dispositivo"
      onBack={() => navigate("/device/assets")}
      backLabel="Torna alla gestione asset"
    >
      {device ? (
        <>
          <dl className="data-list">
            <div className="data-list__row">
              <dt>ID</dt>
              <dd>{device.id}</dd>
            </div>
            <div className="data-list__row">
              <dt>Nome</dt>
              <dd>{device.name}</dd>
            </div>
            <div className="data-list__row">
              <dt>Sistema operativo</dt>
              <dd>{device.operatingSystem}</dd>
            </div>
            <div className="data-list__row">
              <dt>Descrizione</dt>
              <dd>{device.description}</dd>
            </div>
            <div className="data-list__row">
              <dt>Stato</dt>
              <dd>
                <StatusBadge status={getDeviceStatus(session, device)} />
              </dd>
            </div>
          </dl>

          {!hasAssets ? (
            <p className="empty-state" role="alert">
              Nessun asset da valutare: aggiungi almeno un asset prima di avviare.
            </p>
          ) : null}

          <div className="action-bar">
            <button
              type="button"
              className="btn btn--primary"
              onClick={handleStart}
              disabled={!hasAssets}
            >
              Avvia valutazione
            </button>
            <button type="button" className="btn" onClick={() => navigate("/device/assets")}>
              Gestisci asset
            </button>
            <button type="button" className="btn" onClick={() => navigate("/device/edit")}>
              Modifica dispositivo
            </button>
          </div>

          <div className="toolbar">
            <button
              type="button"
              className="btn"
              onClick={() => exportDevice(device, jsonDeviceFormat)}
            >
              Esporta in JSON
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => exportDevice(device, csvDeviceFormat)}
            >
              Esporta in CSV
            </button>
          </div>

          <div className="toolbar">
            <button type="button" className="btn btn--danger" onClick={handleDelete}>
              Elimina dispositivo
            </button>
            <button type="button" className="btn btn--danger" onClick={handleDeleteWithBackup}>
              Elimina con backup
            </button>
          </div>
        </>
      ) : (
        <p className="empty-state">Nessun dispositivo disponibile.</p>
      )}
    </Page>
  );
}
