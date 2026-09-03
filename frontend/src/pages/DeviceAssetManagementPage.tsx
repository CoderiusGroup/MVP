import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Asset } from "../domain/entities/Asset";
import {
  getAssetStatus,
  getEvaluationStatus,
  STATUS_LABELS,
} from "../domain/rules/sessionRules";
import { useDeviceStore } from "../store/DeviceStore";
import { useSessionStore } from "../store/SessionStore";

const EMPTY_ASSETS: Asset[] = [];

export default function DeviceAssetManagementPage() {
  const navigate = useNavigate();
  const device = useDeviceStore((state) => state.device);
  const assets = useDeviceStore((state) => state.device?.assets ?? EMPTY_ASSETS);
  const removeAsset = useDeviceStore((state) => state.removeAsset);
  const session = useSessionStore((state) => state.session);
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
      <button onClick={() => navigate("/")}>Annulla e vai alla Home</button>

      <h1>Gestione Asset</h1>
      {device ? <p>Dispositivo: {device.name}</p> : <p>Nessun dispositivo disponibile.</p>}

      <button onClick={() => navigate("/device/assets/new")}>Aggiungi asset</button>

      <div style={{ margin: "1rem 0" }}>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => navigate("/device")}
          disabled={assets.length === 0}
        >
          Visualizza dettaglio dispositivo
        </button>
      </div>

      {assets.length === 0 ? (
        <p>Nessun asset presente.</p>
      ) : (
        <ul>
          {assets.map((asset) => {
            const isExpanded = asset.id === expandedAssetId;
            const assetStatus = getAssetStatus(session, asset);

            return (
              <li key={asset.id}>
                <button aria-expanded={isExpanded} onClick={() => toggleExpanded(asset.id)}>
                  <strong>{asset.name}</strong> — {asset.type} — {STATUS_LABELS[assetStatus]}
                </button>
                <button onClick={() => navigate(`/device/assets/${asset.id}/edit`)}>
                  Modifica
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
                      <strong>Stato:</strong> {STATUS_LABELS[assetStatus]}
                    </p>
                    <p>
                      <strong>Requisiti:</strong>
                    </p>
                    {asset.requirements && asset.requirements.length > 0 ? (
                      <ul>
                        {asset.requirements.map((requirementId) => (
                          <li key={requirementId}>
                            {requirementId} —{" "}
                            {STATUS_LABELS[getEvaluationStatus(session, asset.id, requirementId)]}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>Nessuno</p>
                    )}
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
