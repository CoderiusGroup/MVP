import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Esito } from "../components/Esito";
import { GrafoDecisionTree } from "../components/GrafoDecisionTree";
import { Loading } from "../components/Loading";
import { NoActiveSession } from "../components/NoActiveSession";
import { StatusBadge } from "../components/StatusBadge";
import { getAssetStatus, getEvaluationStatus } from "../domain/rules/sessionRules";
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
    return <NoActiveSession />;
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
    <div className="page stack">
      {phase === "dashboard" ? (
        <section aria-label="Dashboard di valutazione" className="stack">
          <h1>Valutazione dispositivo</h1>
          <p className="card__meta">
            Asset completati: {progress.assetsDone} / {progress.assetsTotal}
          </p>
          {session.current && currentAsset ? (
            <p className="card__meta">
              In esame: {currentAsset.name} — {session.current.requirementId} (requisiti:{" "}
              {progress.reqDone} / {progress.reqTotal})
            </p>
          ) : null}
          <ul className="list">
            {session.device.assets.map((a) => (
              <li key={a.id} className="card list-row">
                <span>
                  {a.name} — {a.type} — <StatusBadge status={getAssetStatus(session, a)} />
                </span>
                <button
                  type="button"
                  className="btn btn--primary list-row__actions"
                  onClick={() => openAsset(a.id)}
                >
                  Valuta
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : phase === "asset" && selectedAsset ? (
        <section aria-label="Asset in valutazione" className="stack">
          <div>
            <button type="button" className="page__back" onClick={backToDashboard}>
              <span aria-hidden="true">←</span> Torna alla dashboard
            </button>
            <h1>{selectedAsset.name}</h1>
          </div>
          <dl className="data-list">
            <div className="data-list__row">
              <dt>Tipo</dt>
              <dd>{selectedAsset.type}</dd>
            </div>
            <div className="data-list__row">
              <dt>Descrizione</dt>
              <dd>{selectedAsset.description}</dd>
            </div>
            <div className="data-list__row">
              <dt>Sensibilità</dt>
              <dd>{selectedAsset.sensitive ? "Sensibile" : "Non sensibile"}</dd>
            </div>
            <div className="data-list__row">
              <dt>Stato</dt>
              <dd>
                <StatusBadge status={getAssetStatus(session, selectedAsset)} />
              </dd>
            </div>
          </dl>
          <h2>Requisiti</h2>
          <ul className="list">
            {(selectedAsset.requirements ?? []).map((r) => {
              const evaluated =
                session.evaluations.find(
                  (e) => e.assetId === selectedAsset.id && e.requirementId === r,
                )?.status === "completed";
              return (
                <li key={r} className="list-row">
                  <span>
                    {r} — <StatusBadge status={getEvaluationStatus(session, selectedAsset.id, r)} />
                  </span>
                  <button
                    type="button"
                    className="btn btn--ghost list-row__actions"
                    onClick={() => openRequirement(selectedAsset.id, r)}
                    disabled={evaluated}
                  >
                    {evaluated ? "Completato" : "Apri"}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ) : phase === "requirement" && selectedAsset && selectedRequirementId ? (
        <section aria-label="Dettaglio requisito" className="stack">
          <div>
            <button type="button" className="page__back" onClick={backToAsset}>
              <span aria-hidden="true">←</span> Indietro
            </button>
            <h1>
              {selectedRequirementId}
              {requirementDetail ? ` — ${requirementDetail.name}` : ""}
            </h1>
          </div>
          <h2>Dipendenze</h2>
          {requirementDetail ? (
            requirementDetail.dependencies.length === 0 ? (
              <p className="empty-state">Nessuna dipendenza.</p>
            ) : (
              <ul className="list">
                {requirementDetail.dependencies.map((dep) => (
                  <li key={dep} className="list-row">
                    {dep} —{" "}
                    <StatusBadge status={getEvaluationStatus(session, selectedAsset.id, dep)} />
                  </li>
                ))}
              </ul>
            )
          ) : (
            <Loading label="Caricamento dettagli requisito…" />
          )}
          <button type="button" className="btn btn--primary" onClick={startRequirement}>
            Avvia decision tree
          </button>
        </section>
      ) : (
        <section aria-label="Esecuzione decision tree" className="stack">
          <p className="card__meta">
            <strong>Asset:</strong> {asset ? asset.name : "—"} &nbsp;
            <strong>Requisito:</strong> {requirementId}
          </p>

          {status === "error" ? (
            <p role="alert" className="empty-state">
              Impossibile caricare l'albero decisionale.
            </p>
          ) : status === "loading" || !currentNode ? (
            <Loading label="Caricamento albero decisionale…" />
          ) : currentNode.type === "question" ? (
            <section aria-label="Domanda corrente" className="card">
              <p className="card__meta">
                <strong>Nodo:</strong> {currentNode.id}
              </p>
              <p>{currentNode.text}</p>
              <div className="toolbar">
                <button type="button" className="btn btn--primary" onClick={() => answer(true)}>
                  Sì
                </button>
                <button type="button" className="btn" onClick={() => answer(false)}>
                  No
                </button>
              </div>
            </section>
          ) : (
            <section aria-label="Esito requisito" className="card">
              <p className="card__meta">Esito: {outcome ? <Esito outcome={outcome} /> : null}</p>
              {currentNode.text ? <p>{currentNode.text}</p> : null}
              <button type="button" className="btn btn--primary" onClick={confirmOutcome}>
                Conferma esito
              </button>
            </section>
          )}

          {tree && currentNodeId ? (
            <GrafoDecisionTree tree={tree} currentNodeId={currentNodeId} path={path} />
          ) : null}

          <div className="toolbar">
            <button type="button" className="btn" onClick={goBack} disabled={!canGoBack}>
              Indietro
            </button>
          </div>
        </section>
      )}

      <div className="action-bar">
        <button type="button" className="btn" onClick={saveSession}>
          Salva sessione
        </button>
        <button type="button" className="btn btn--danger" onClick={() => setConfirmingExit(true)}>
          Esci dal test
        </button>
      </div>

      {confirmingExit ? (
        <section aria-label="Conferma uscita dal test" className="card">
          <p>Vuoi salvare la sessione prima di uscire?</p>
          <div className="toolbar">
            <button type="button" className="btn btn--primary" onClick={exitSaving}>
              Salva ed esci
            </button>
            <button type="button" className="btn btn--danger" onClick={exitDiscarding}>
              Esci senza salvare
            </button>
            <button type="button" className="btn" onClick={() => setConfirmingExit(false)}>
              Annulla
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
