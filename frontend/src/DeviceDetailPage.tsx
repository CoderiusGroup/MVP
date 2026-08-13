import type { Device } from "./domain/entities/Device";

type Props ={
    device: Device | null;
    payload: unknown;
    onBack: () => void;
};

export default function DeviceDetailPage({device, onBack}: Props) {
    return (
        <div style={{padding: "1rem"}}>
        <button onClick={onBack}>Torna indietro</button>

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