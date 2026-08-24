import { useNavigate } from "react-router-dom";

import { Esito } from "../components/Esito";
import { getAssetStatus, getEvaluationStatus, STATUS_LABELS } from "../domain/rules/sessionRules";
import { useResult } from "../hooks/useResult";
import { downloadSession } from "../services/SessionService";
import { useSessionStore } from "../store/SessionStore";

export function ResultPage() {
  const navigate = useNavigate();
  const session = useSessionStore((state) => state.session);
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
    return (
      <div style={{ padding: "1rem" }}>
        <p role="alert">Nessuna sessione attiva.</p>
        <button type="button" onClick={() => navigate("/")}>
          Torna alla Home
        </button>
      </div>
    );
  }

  const selectedAsset = session.device.assets.find((a) => a.id === selectedAssetId) ?? null;
  const selectedEvaluation =
    selectedAsset && selectedRequirementId
      ? session.evaluations.find(
          (e) => e.assetId === selectedAsset.id && e.requirementId === selectedRequirementId,
        )
      : undefined;

  return (
    <div style={{ padding: "1rem" }}>
      <h1>Valutazione completata</h1>

      {/* UC-27.1.1: dettaglio requisito con percorso logico */}
      {selectedAsset && selectedRequirementId ? (
        <section aria-label="Dettaglio requisito con esito">
          <button type="button" onClick={clearRequirement}>
            Torna all'asset
          </button>
          <h2>
            {selectedRequirementId}{" "}
            {selectedEvaluation?.outcome ? <Esito outcome={selectedEvaluation.outcome} /> : "—"}
          </h2>
          <h3>Percorso logico</h3>
          {pathQuestions === null ? (
            <p>Caricamento percorso...</p>
          ) : pathQuestions.length === 0 ? (
            <p>Nessuna domanda registrata.</p>
          ) : (
            <ol>
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
        /* UC-27.1: riepilogo per asset */
        <section aria-label="Riepilogo asset">
          <button type="button" onClick={clearAsset}>
            Torna ai risultati
          </button>
          <h2>{selectedAsset.name}</h2>
          <p>Tipo: {selectedAsset.type}</p>
          <p>Esito: {STATUS_LABELS[getAssetStatus(session, selectedAsset)]}</p>
          <h3>Requisiti</h3>
          <ul>
            {(selectedAsset.requirements ?? []).map((r) => (
              <li key={r}>
                {r} — {STATUS_LABELS[getEvaluationStatus(session, selectedAsset.id, r)]}{" "}
                <button type="button" onClick={() => selectRequirement(r)}>
                  Dettaglio
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        /* UC-27: lista asset con esito aggregato */
        <section aria-label="Risultati per asset">
          <ul>
            {session.device.assets.map((asset) => (
              <li key={asset.id}>
                {asset.name} — {STATUS_LABELS[getAssetStatus(session, asset)]}{" "}
                <button type="button" onClick={() => selectAsset(asset.id)}>
                  Dettaglio
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div style={{ marginTop: "1rem" }}>
        <button type="button" onClick={() => downloadSession(session)}>
          Salva sessione
        </button>
        <button type="button" onClick={() => navigate("/session/modify")}>
          Modifica sessione
        </button>
        <button type="button" onClick={() => navigate("/")}>
          Torna alla Home
        </button>
      </div>
    </div>
  );
}
