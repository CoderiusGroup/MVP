import { useNavigate } from "react-router-dom";
import { getDeviceStatus, STATUS_LABELS } from "../domain/rules/sessionRules";
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
    <div style={{ padding: "1rem" }}>
      <button onClick={() => navigate("/device/assets")}>Torna alla Gestione Asset</button>

      <h1>Dettaglio Dispositivo (Riepilogo)</h1>

      {device ? (
        <>
          <p>
            <strong>ID:</strong> {device.id}
          </p>
          <p>
            <strong>Nome:</strong> {device.name}
          </p>
          <p>
            <strong>Sistema operativo:</strong> {device.operatingSystem}
          </p>
          <p>
            <strong>Descrizione:</strong> {device.description}
          </p>
          <p>
            <strong>Stato:</strong> {STATUS_LABELS[getDeviceStatus(session, device)]}
          </p>

          <button type="button" onClick={() => navigate("/device/edit")}>
            Modifica dispositivo
          </button>

          <button type="button" onClick={() => exportDevice(device, jsonDeviceFormat)}>
            Esporta in JSON
          </button>
          <button type="button" onClick={() => exportDevice(device, csvDeviceFormat)}>
            Esporta in CSV
          </button>

          <button type="button" onClick={handleStart} disabled={!hasAssets}>
            Avvia valutazione
          </button>
          {!hasAssets ? (
            <p>Nessun asset da valutare: aggiungi almeno un asset prima di avviare.</p>
          ) : null}
          <button onClick={() => navigate("/device/assets")}>Gestisci asset</button>

          <button type="button" onClick={handleDelete}>
            Elimina dispositivo
          </button>
          <button type="button" onClick={handleDeleteWithBackup}>
            Elimina con backup
          </button>
        </>
      ) : (
        <p>Nessun dispositivo disponibile.</p>
      )}
    </div>
  );
}
