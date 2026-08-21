import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDeviceStore } from "../store/DeviceStore";

export default function DeviceAssetManagementPage() {
  const navigate = useNavigate();
  const device = useDeviceStore((state) => state.device);
  const assets = useDeviceStore((state) => state.assets);
  const removeAsset = useDeviceStore((state) => state.removeAsset);
  const [expandedAssetId, setExpandedAssetId] = useState<string | null>(null);

  const handleRemove = (assetId: string) => {
    if (window.confirm("Confermi l'eliminazione dell'asset?")) {
      removeAsset(assetId);
    }
  };

  const toggleExpanded = (assetId: string) => {
    setExpandedAssetId((current) => (current === assetId ? null : assetId));
  };

  return (
    <div style={{ padding: "1rem" }}>
      <button onClick={() => navigate("/device")}>Torna indietro</button>

      <h1>Gestione Asset</h1>
      {device ? <p>Dispositivo: {device.name}</p> : <p>Nessun dispositivo disponibile.</p>}

      <button onClick={() => navigate("/device/assets/new")}>Aggiungi asset</button>

      {assets.length === 0 ? (
        <p>Nessun asset presente.</p>
      ) : (
        <ul>
          {assets.map((asset) => {
            const isExpanded = asset.id === expandedAssetId;

            return (
              <li key={asset.id}>
                <button aria-expanded={isExpanded} onClick={() => toggleExpanded(asset.id)}>
                  <strong>{asset.name}</strong> — {asset.type}
                </button>
                <button onClick={() => handleRemove(asset.id)}>Rimuovi</button>

                {isExpanded && (
                  <div style={{ marginLeft: "1rem" }}>
                    <p>
                      <strong>Descrizione:</strong> {asset.description}
                    </p>
                    <p>
                      <strong>Sensibile:</strong> {asset.sensitive ? "Sì" : "No"}
                    </p>
                    <p>
                      <strong>Requisiti:</strong>{" "}
                      {asset.requirements && asset.requirements.length > 0
                        ? asset.requirements.join(", ")
                        : "Nessuno"}
                    </p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
