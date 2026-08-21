import { useNavigate } from "react-router-dom";

import { Esito } from "../components/Esito";
import { useSessionRunner } from "../hooks/useSessionRunner";

export function SessionPage() {
  const navigate = useNavigate();
  const {
    status,
    session,
    isCompleted,
    asset,
    requirementId,
    currentNode,
    outcome,
    progress,
    answer,
    goBack,
    canGoBack,
    goToNext,
    saveSession,
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
    return (
      <div style={{ padding: "1rem" }}>
        <h1>Valutazione completata</h1>
        <ul>
          {session.evaluations.map((evaluation) => (
            <li key={`${evaluation.assetId}-${evaluation.requirementId}`}>
              {evaluation.assetId} — {evaluation.requirementId}:{" "}
              {evaluation.outcome ? <Esito outcome={evaluation.outcome} /> : "—"}
            </li>
          ))}
        </ul>
        <button type="button" onClick={saveSession}>
          Salva sessione
        </button>
        <button type="button" onClick={() => navigate("/session/modify")}>
          Modifica sessione
        </button>
        <button type="button" onClick={() => navigate("/")}>
          Torna alla Home
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "1rem" }}>
      <p>
        Avanzamento: {progress.done} / {progress.total}
      </p>
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
          <p>
            Esito: {outcome ? <Esito outcome={outcome} /> : null}
          </p>
          {currentNode.text ? <p>{currentNode.text}</p> : null}
          <button type="button" onClick={goToNext}>
            Prossimo requisito
          </button>
        </section>
      )}

      <div style={{ marginTop: "1rem" }}>
        <button type="button" onClick={goBack} disabled={!canGoBack}>
          Indietro
        </button>
        <button type="button" onClick={saveSession}>
          Salva sessione
        </button>
        <button type="button" onClick={() => navigate("/session/modify")}>
          Modifica sessione
        </button>
      </div>
    </div>
  );
}
