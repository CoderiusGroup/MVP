import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Page } from "../components/Page";
import { StatusBadge } from "../components/StatusBadge";
import type { Asset } from "../domain/entities/Asset";
import { getAssetStatus, getEvaluationStatus, STATUS_LABELS } from "../domain/rules/sessionRules";
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
    <Page title="Gestione asset" onBack={() => navigate("/")} backLabel="Torna alla Home">
      {device ? (
        <p className="card__meta">Dispositivo: {device.name}</p>
      ) : (
        <p className="empty-state">Nessun dispositivo disponibile.</p>
      )}

      <div className="toolbar">
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => navigate("/device/assets/new")}
        >
          Aggiungi asset
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => navigate("/device")}
          disabled={assets.length === 0}
        >
          Visualizza dettaglio dispositivo
        </button>
      </div>

      {assets.length === 0 ? (
        <p className="empty-state">Nessun asset presente.</p>
      ) : (
        <ul className="list">
          {assets.map((asset) => {
            const isExpanded = asset.id === expandedAssetId;
            const assetStatus = getAssetStatus(session, asset);

            return (
              <li key={asset.id} className="card">
                <div className="list-row">
                  <button
                    type="button"
                    className="btn btn--ghost"
                    aria-expanded={isExpanded}
                    onClick={() => toggleExpanded(asset.id)}
                  >
                    <strong>{asset.name}</strong> — {asset.type}
                  </button>
                  <StatusBadge status={assetStatus} />
                  <span className="list-row__actions">
                    <button
                      type="button"
                      className="btn"
                      onClick={() => navigate(`/device/assets/${asset.id}/edit`)}
                    >
                      Modifica
                    </button>
                    <button
                      type="button"
                      className="btn btn--danger"
                      onClick={() => handleRemove(asset.id)}
                    >
                      Rimuovi
                    </button>
                  </span>
                </div>

                {isExpanded && (
                  <dl className="data-list data-list--nested">
                    <div className="data-list__row">
                      <dt>Descrizione:</dt>
                      <dd>{asset.description}</dd>
                    </div>
                    <div className="data-list__row">
                      <dt>Sensibile:</dt>
                      <dd>{asset.sensitive ? "Sì" : "No"}</dd>
                    </div>
                    <div className="data-list__row">
                      <dt>Stato:</dt>
                      <dd>
                        <StatusBadge status={assetStatus} />
                      </dd>
                    </div>
                    <div className="data-list__row">
                      <dt>Requisiti:</dt>
                      <dd>
                        {asset.requirements && asset.requirements.length > 0 ? (
                          <ul className="list">
                            {asset.requirements.map((requirementId) => (
                              <li key={requirementId}>
                                {requirementId} —{" "}
                                {
                                  STATUS_LABELS[
                                    getEvaluationStatus(session, asset.id, requirementId)
                                  ]
                                }
                              </li>
                            ))}
                          </ul>
                        ) : (
                          "Nessuno"
                        )}
                      </dd>
                    </div>
                  </dl>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Page>
  );
}
