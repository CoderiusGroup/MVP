import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Esito } from "../components/Esito";
import { GrafoDecisionTree } from "../components/GrafoDecisionTree";
import { getAssetStatus, getEvaluationStatus, STATUS_LABELS } from "../domain/rules/sessionRules";
import { useSessionRunner } from "../hooks/useSessionRunner";
import { ResultPage } from "./ResultPage";

export function SessionRunnerPage() {
  const navigate = useNavigate();
  const [confirmingExit, setConfirmingExit] = useState(false);
  const {
    phase,
    status,
    session,
    isCompleted,
    progress,
    selectedAsset,
    selectedRequirementId,
    requirementDetail,
    asset,
    requirementId,
    tree,
    currentNodeId,
    path,
    currentNode,
    outcome,
    answer,
    goBack,
    canGoBack,
    openAsset,
    openRequirement,
    startRequirement,
    backToDashboard,
    backToAsset,
    confirmOutcome,
    saveSession,
    endSession,
  } = useSessionRunner();

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

  if (isCompleted) {
    return <ResultPage />;
  }

  // UC-24: uscita anticipata dal test.
  const exitDiscarding = () => {
    endSession();
    navigate("/");
  };
  const exitSaving = () => {
    saveSession();
    endSession();
    navigate("/");
  };

  const currentAsset = session.current
    ? session.device.assets.find((a) => a.id === session.current?.assetId)
    : undefined;

  return (
    <div style={{ padding: "1rem" }}>
      {phase === "dashboard" ? (
        <section aria-label="Dashboard di valutazione">
          <h1>Valutazione dispositivo</h1>
          <p>
            Asset completati: {progress.assetsDone} / {progress.assetsTotal}
          </p>
          {session.current && currentAsset ? (
            <p>
              In esame: {currentAsset.name} — {session.current.requirementId} (requisiti:{" "}
              {progress.reqDone} / {progress.reqTotal})
            </p>
          ) : null}
          <ul>
            {session.device.assets.map((a) => (
              <li key={a.id}>
                {a.name} — {a.type} — {STATUS_LABELS[getAssetStatus(session, a)]}{" "}
                <button type="button" onClick={() => openAsset(a.id)}>
                  Valuta
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : phase === "asset" && selectedAsset ? (
        <section aria-label="Asset in valutazione">
          <button type="button" onClick={backToDashboard}>
            Torna alla dashboard
          </button>
          <h1>{selectedAsset.name}</h1>
          <p>Tipo: {selectedAsset.type}</p>
          <p>Descrizione: {selectedAsset.description}</p>
          <p>Sensibilità: {selectedAsset.sensitive ? "Sensibile" : "Non sensibile"}</p>
          <p>Stato: {STATUS_LABELS[getAssetStatus(session, selectedAsset)]}</p>
          <h2>Requisiti</h2>
          <ul>
            {(selectedAsset.requirements ?? []).map((r) => (
              <li key={r}>
                {r} — {STATUS_LABELS[getEvaluationStatus(session, selectedAsset.id, r)]}{" "}
                <button type="button" onClick={() => openRequirement(selectedAsset.id, r)}>
                  Apri
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : phase === "requirement" && selectedAsset && selectedRequirementId ? (
        <section aria-label="Dettaglio requisito">
          <button type="button" onClick={backToAsset}>
            Indietro
          </button>
          <h1>
            {selectedRequirementId}
            {requirementDetail ? ` — ${requirementDetail.name}` : ""}
          </h1>
          <h2>Dipendenze</h2>
          {requirementDetail ? (
            requirementDetail.dependencies.length === 0 ? (
              <p>Nessuna dipendenza.</p>
            ) : (
              <ul>
                {requirementDetail.dependencies.map((dep) => (
                  <li key={dep}>
                    {dep} — {STATUS_LABELS[getEvaluationStatus(session, selectedAsset.id, dep)]}
                  </li>
                ))}
              </ul>
            )
          ) : (
            <p>Caricamento dettagli requisito...</p>
          )}
          <button type="button" onClick={startRequirement}>
            Avvia decision tree
          </button>
        </section>
      ) : (
        <section aria-label="Esecuzione decision tree">
          <p>
            <strong>Asset:</strong> {asset ? asset.name : "—"} &nbsp;
            <strong>Requisito:</strong> {requirementId}
          </p>

          {status === "error" ? (
            <p role="alert">Impossibile caricare l'albero decisionale.</p>
          ) : status === "loading" || !currentNode ? (
            <p>Caricamento albero decisionale...</p>
          ) : currentNode.type === "question" ? (
            <section aria-label="Domanda corrente">
              <p>
                <strong>Nodo:</strong> {currentNode.id}
              </p>
              <p>{currentNode.text}</p>
              <button type="button" onClick={() => answer(true)}>
                Sì
              </button>
              <button type="button" onClick={() => answer(false)}>
                No
              </button>
            </section>
          ) : (
            <section aria-label="Esito requisito">
              <p>Esito: {outcome ? <Esito outcome={outcome} /> : null}</p>
              {currentNode.text ? <p>{currentNode.text}</p> : null}
              <button type="button" onClick={confirmOutcome}>
                Conferma esito
              </button>
            </section>
          )}

          {tree && currentNodeId ? (
            <GrafoDecisionTree tree={tree} currentNodeId={currentNodeId} path={path} />
          ) : null}

          <div style={{ marginTop: "1rem" }}>
            <button type="button" onClick={goBack} disabled={!canGoBack}>
              Indietro
            </button>
          </div>
        </section>
      )}

      <div style={{ marginTop: "1rem" }}>
        <button type="button" onClick={saveSession}>
          Salva sessione
        </button>
        <button type="button" onClick={() => navigate("/session/modify")}>
          Modifica sessione
        </button>
        <button type="button" onClick={() => setConfirmingExit(true)}>
          Esci dal test
        </button>
      </div>

      {confirmingExit ? (
        <section aria-label="Conferma uscita dal test" style={{ marginTop: "1rem" }}>
          <p>Vuoi salvare la sessione prima di uscire?</p>
          <button type="button" onClick={exitSaving}>
            Salva ed esci
          </button>
          <button type="button" onClick={exitDiscarding}>
            Esci senza salvare
          </button>
          <button type="button" onClick={() => setConfirmingExit(false)}>
            Annulla
          </button>
        </section>
      ) : null}
    </div>
  );
}
