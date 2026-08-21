import { useNavigate } from "react-router-dom";
import { getDeviceStatus, STATUS_LABELS } from "../domain/rules/sessionRules";
import { useDeviceStore } from "../store/DeviceStore";
import { useSessionStore } from "../store/SessionStore";

export default function DeviceSummaryPage() {
    const navigate = useNavigate();
    const device = useDeviceStore((state) => state.device);
    const session = useSessionStore((state) => state.session);
    const startSession = useSessionStore((state) => state.start);

    const hasAssets = !!device && device.assets.length > 0;

    const handleStart = () => {
        if (!device) {
            return;
        }
        startSession(device);
        navigate("/session");
    };

    return (
        <div style={{padding: "1rem"}}>
        <button onClick={() => navigate("/")}>Torna indietro</button>

        <h1>Dettaglio Dispositivo</h1>

        {device ? (
        <>
          <p><strong>ID:</strong> {device.id}</p>
          <p><strong>Nome:</strong> {device.name}</p>
          <p><strong>Sistema operativo:</strong> {device.operatingSystem}</p>
          <p><strong>Descrizione:</strong> {device.description}</p>
          <p><strong>Stato:</strong> {STATUS_LABELS[getDeviceStatus(session, device)]}</p>

          <button type="button" onClick={handleStart} disabled={!hasAssets}>
            Avvia valutazione
          </button>
          {!hasAssets ? (
            <p>Nessun asset da valutare: aggiungi almeno un asset prima di avviare.</p>
          ) : null}
          <button onClick={() => navigate("/device/assets")}>Gestisci asset</button>
        </>
        ) : (
            <p>Nessun dispositivo disponibile.</p>
        )}
        </div>
    );
}
