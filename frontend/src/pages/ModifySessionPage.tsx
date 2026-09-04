import { useNavigate } from "react-router-dom";

import { Esito } from "../components/Esito";
import { NoActiveSession } from "../components/NoActiveSession";
import { Page } from "../components/Page";
import { STATUS_LABELS } from "../domain/rules/sessionRules";
import { useSessionModify } from "../hooks/useSessionModify";

export function ModifySessionPage() {
  const navigate = useNavigate();
  const { session, names, resume, redo } = useSessionModify();

  if (!session) {
    return <NoActiveSession />;
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
    <Page
      title="Modifica sessione"
      onBack={() => navigate("/session")}
      backLabel="Torna alla sessione"
    >
      {session.device.assets.map((asset) => (
        <section key={asset.id} aria-label={`Asset ${asset.name}`} className="card">
          <h2 className="card__title">{asset.name}</h2>
          <ul className="list">
            {session.evaluations
              .filter((evaluation) => evaluation.assetId === asset.id)
              .map((evaluation) => (
                <li key={evaluation.requirementId} className="list-row">
                  <span>
                    {evaluation.requirementId}
                    {names[evaluation.requirementId]
                      ? ` — ${names[evaluation.requirementId]}`
                      : ""}
                  </span>
                  {evaluation.outcome ? (
                    <Esito outcome={evaluation.outcome} />
                  ) : (
                    <span className="status-badge status-badge--neutral">
                      {STATUS_LABELS[evaluation.status as keyof typeof STATUS_LABELS] ??
                        evaluation.status}
                    </span>
                  )}
                  <span className="list-row__actions">
                    {evaluation.status === "completed" ? (
                      <button
                        type="button"
                        className="btn"
                        onClick={() => handleRedo(asset.id, evaluation.requirementId)}
                      >
                        Rivaluta
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn--primary"
                        onClick={() => handleResume(asset.id, evaluation.requirementId)}
                      >
                        Riprendi
                      </button>
                    )}
                  </span>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </Page>
  );
}
