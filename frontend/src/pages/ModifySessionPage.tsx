import { useNavigate } from "react-router-dom";

import { Esito } from "../components/Esito";
import { useSessionModify } from "../hooks/useSessionModify";

export function ModifySessionPage() {
  const navigate = useNavigate();
  const { session, names, resume, redo } = useSessionModify();

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

  const handleResume = (assetId: string, requirementId: string) => {
    resume(assetId, requirementId);
    navigate("/session");
  };

  const handleRedo = (assetId: string, requirementId: string) => {
    redo(assetId, requirementId);
    navigate("/session");
  };

  return (
    <div style={{ padding: "1rem" }}>
      <h1>Modifica sessione</h1>

      {session.device.assets.map((asset) => (
        <section key={asset.id} aria-label={`Asset ${asset.name}`}>
          <h2>{asset.name}</h2>
          <ul>
            {session.evaluations
              .filter((evaluation) => evaluation.assetId === asset.id)
              .map((evaluation) => (
                <li key={evaluation.requirementId}>
                  {evaluation.requirementId}
                  {names[evaluation.requirementId]
                    ? ` — ${names[evaluation.requirementId]}`
                    : ""}{" "}
                  {evaluation.outcome ? (
                    <Esito outcome={evaluation.outcome} />
                  ) : (
                    `(${evaluation.status})`
                  )}{" "}
                  {evaluation.status === "completed" ? (
                    <button
                      type="button"
                      onClick={() => handleRedo(asset.id, evaluation.requirementId)}
                    >
                      Rivaluta
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleResume(asset.id, evaluation.requirementId)}
                    >
                      Riprendi
                    </button>
                  )}
                </li>
              ))}
          </ul>
        </section>
      ))}

      <button type="button" onClick={() => navigate("/session")}>
        Torna alla sessione
      </button>
    </div>
  );
}
