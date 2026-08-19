import { useNavigate } from "react-router-dom";
import { useDeviceStore } from "../store/DeviceStore";

export default function DeviceSummaryPage() {
    const navigate = useNavigate();
    const device = useDeviceStore((state) => state.device);

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
        </>
        ) : (
            <p>Nessun dispositivo disponibile.</p>
        )}
        </div>
    );
}
