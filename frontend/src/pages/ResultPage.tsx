import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Esito } from "../components/Esito";
import { NoActiveSession } from "../components/NoActiveSession";
import { Page } from "../components/Page";
import { StatusBadge } from "../components/StatusBadge";
import { getAssetStatus, getEvaluationStatus } from "../domain/rules/sessionRules";
import { useResult } from "../hooks/useResult";
import { NotificationManager } from "../infrastructure/NotificationManager";
import { exportReportPdf } from "../services/ReportService";
import { downloadSession } from "../services/SessionService";
import { useSessionStore } from "../store/SessionStore";

const notification = new NotificationManager();

export function ResultPage() {
  const navigate = useNavigate();
  const session = useSessionStore((state) => state.session);
  const [exportingReport, setExportingReport] = useState(false);
  const {
    selectedAssetId,
    selectedRequirementId,
    pathQuestions,
    selectAsset,
    selectRequirement,
    clearAsset,
    clearRequirement,
  } = useResult();

  if (!session) {
    return <NoActiveSession />;
  }

  const handleExportReport = async () => {
    setExportingReport(true);
    try {
      await exportReportPdf(session);
    } catch {
      notification.error("Esportazione del report non riuscita");
    } finally {
      setExportingReport(false);
    }
  };

  const handleBack = () => {
    if (selectedRequirementId) {
      clearRequirement();
    } else if (selectedAssetId) {
      clearAsset();
    } else {
      navigate("/");
    }
  };

  const selectedAsset = session.device.assets.find((a) => a.id === selectedAssetId) ?? null;
  const selectedEvaluation =
    selectedAsset && selectedRequirementId
      ? session.evaluations.find(
          (e) => e.assetId === selectedAsset.id && e.requirementId === selectedRequirementId,
        )
      : undefined;

  return (
    <Page
      title="Valutazione completata"
      onBack={handleBack}
      backLabel={selectedAssetId ? "Indietro" : "Torna alla Home"}
    >
      {selectedAsset && selectedRequirementId ? (
        <section aria-label="Dettaglio requisito con esito" className="card">
          <h2 className="card__title">
            {selectedRequirementId}{" "}
            {selectedEvaluation?.outcome ? <Esito outcome={selectedEvaluation.outcome} /> : "—"}
          </h2>
          <h3>Percorso logico</h3>
          {pathQuestions === null ? (
            <p className="loading" role="status">
              Caricamento…
            </p>
          ) : pathQuestions.length === 0 ? (
            <p className="empty-state">Nessuna domanda registrata.</p>
          ) : (
            <ol className="list">
              {pathQuestions.map((question, index) => (
                <li key={`${question.nodeId}-${index}`}>
                  <strong>{question.nodeId}</strong> — {question.text} →{" "}
                  {question.answer === "yes" ? "Sì" : "No"}
                </li>
              ))}
            </ol>
          )}
        </section>
      ) : selectedAsset ? (
        <section aria-label="Riepilogo asset" className="card">
          <h2 className="card__title">{selectedAsset.name}</h2>
          <p className="card__meta">Tipo: {selectedAsset.type}</p>
          <p className="card__meta">
            Esito: <StatusBadge status={getAssetStatus(session, selectedAsset)} />
          </p>
          <h3>Requisiti</h3>
          <ul className="list">
            {(selectedAsset.requirements ?? []).map((r) => (
              <li key={r} className="list-row">
                <span>
                  {r} — <StatusBadge status={getEvaluationStatus(session, selectedAsset.id, r)} />
                </span>
                <button
                  type="button"
                  className="btn btn--ghost list-row__actions"
                  onClick={() => selectRequirement(r)}
                >
                  Dettaglio
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section aria-label="Risultati per asset">
          <ul className="list">
            {session.device.assets.map((asset) => (
              <li key={asset.id} className="card list-row">
                <span>
                  {asset.name} — <StatusBadge status={getAssetStatus(session, asset)} />
                </span>
                <button
                  type="button"
                  className="btn btn--ghost list-row__actions"
                  onClick={() => selectAsset(asset.id)}
                >
                  Dettaglio
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="action-bar">
        <button type="button" className="btn" onClick={() => downloadSession(session)}>
          Salva sessione
        </button>
        <button
          type="button"
          className="btn btn--primary"
          onClick={handleExportReport}
          disabled={exportingReport}
        >
          {exportingReport ? "Esportazione in corso..." : "Esporta report PDF"}
        </button>
        <button type="button" className="btn" onClick={() => navigate("/")}>
          Torna alla Home
        </button>
      </div>
    </Page>
  );
}
